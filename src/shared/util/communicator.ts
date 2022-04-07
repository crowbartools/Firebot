import IpcEvents from "SharedTypes/ipc/ipc-events";
import IpcMethods from "SharedTypes/ipc/ipc-methods";

import { jsonClone, wildcard } from "SharedUtils";
import { WebContents, IpcRenderer } from "electron";

export interface IpcMessage {
    type: "event" | "invoke" | "reply";
    name: string;
    id: number;
}
export interface IpcMessageEvent<E extends keyof IpcEvents> extends IpcMessage {
    type: "event";
    data: IpcEvents[E];
}
export interface IpcMessageInvoke extends IpcMessage {
    type: "invoke";
    data: any;
}
export interface IpcMessageReply extends IpcMessage {
    type: "reply";
    status: "ok" | "error";
    result: any;
}
export interface IpcEventHandler {
    (sender: any, data: IpcMessage): void;
}
export interface IpcEmitter {
    on: (channel: string, handler: IpcEventHandler) => void;
    off: (channel: string, handler: IpcEventHandler) => void;
}
export interface IpcSend {
    (channel: string, message: IpcMessage): void;
}

interface Listener<E extends keyof IpcEvents> {
    handler: (data: IpcMessageEvent<E>["data"]) => void;
    once: boolean;
}

type HandlerFunc<M extends keyof IpcMethods> = (
    ...data: Parameters<IpcMethods[M]>
) => Promise<ReturnType<IpcMethods[M]>>;

type IpcSender = WebContents | IpcRenderer;

const listeners: Record<string, Listener<keyof IpcEvents>[]> = {};
const methods: Record<string, HandlerFunc<keyof IpcMethods>> = {};

let emitter: IpcEmitter;
let sender: IpcSender;
let msgId = 0;

export function on<E extends keyof IpcEvents>(
    event: E,
    handler: (data: IpcMessageEvent<E>["data"]) => void,
    once = false
): void {
    if (listeners[event] == null) {
        listeners[event] = [];
    }

    listeners[event].push({
        handler,
        once,
    });
}

export function once<E extends keyof IpcEvents>(
    event: E,
    handler: (data: IpcMessageEvent<E>["data"]) => void
): void {
    on(event, handler, true);
}

export function off<E extends keyof IpcEvents>(
    event: E,
    handler: (data: IpcMessageEvent<E>["data"]) => void,
    once = false
): void {
    if (listeners[event]?.length === 0) {
        listeners[event] = null;
    }

    if (listeners[event] != null) {
        let i = 0;
        while (i < listeners[event].length) {
            const listener = listeners[event][i];

            if (listener.handler === handler && listener.once === once) {
                listeners[event].splice(i, 1);
                if (listeners[event].length === 0) {
                    listeners[event] = null;
                }
                break;
            }
            i += 1;
        }
    }
}

export function offOnce<E extends keyof IpcEvents>(
    event: E,
    handler: (data: IpcMessageEvent<E>["data"]) => void
): void {
    off(event, handler, true);
}

export function emit<E extends keyof IpcEvents>(
    event: E,
    data: IpcEvents[E]
): void {
    if (sender == null) {
        throw new Error("not initialized");
    }
    sender.send("firebot-comm", <IpcMessageEvent<E>>{
        type: "event",
        name: event,
        data,
        id: 0,
    });
}

const processEvent = function <E extends keyof IpcEvents>(
    event: IpcMessageEvent<E>
) {
    if (listeners[event.name] != null) {
        // static listeners get priority
        const evtlisteners = listeners[event.name];
        let i = 0;
        while (i < evtlisteners.length) {
            const { handler, once } = evtlisteners[i];

            try {
                handler(jsonClone(event.data as never));

                if (once === true) {
                    evtlisteners.splice(i, 1);
                } else {
                    i += 1;
                }
            } catch (err) {
                console.log(
                    `Error From Communicator Listener of ${event.name}`,
                    err
                );
                evtlisteners.splice(i, 1);
            }
        }
    } else if (
        event.name.indexOf("?") === -1 &&
        event.name.indexOf("*") === -1
    ) {
        // Get a list of events that have listeners
        Object.keys(listeners)
            .filter((key) => {
                // ignore the event names that are not wildcards
                if (key.indexOf("*") === -1 && key.indexOf("?") === -1) {
                    return false;
                }

                // filter out wildcard event names that do not match the event
                return wildcard(key).test(event.name);
            })

            // loop over the remaining list of event names and call the processor for them
            .forEach((key) => {
                event.name = key;
                processEvent(event);
            });
    }
};

export function register<M extends keyof IpcMethods>(
    method: M,
    handler: HandlerFunc<M>
): void {
    if (methods[method] != null) {
        throw new Error("method already registered");
    }

    methods[method] = handler;
}

export function unregister<M extends keyof IpcMethods>(
    method: M,
    handler: HandlerFunc<M>
): void {
    if (methods[method] == null) {
        throw new Error(`method '${method}' not registered`);
    }
    if (methods[method] !== handler) {
        throw new Error(`handler for '${method}' does not match given handler`);
    }

    methods[method] = null;
}

export function invoke<M extends Extract<keyof IpcMethods, string>>(
    method: M,
    ...data: Parameters<IpcMethods[M]>
): Promise<ReturnType<IpcMethods[M]>> {
    if (sender == null || emitter == null) {
        throw new Error("not initialized");
    }

    msgId += 1;
    const invocation: IpcMessageInvoke = {
        type: "invoke",
        name: method,
        data,
        id: msgId,
    };

    return new Promise((resolve, reject) => {
        const waiter = (sender: any, message: IpcMessage) => {
            if (message.type !== "reply" || message.id !== invocation.id) {
                return;
            }

            emitter.off("firebot-comm", waiter);

            const reply = message as IpcMessageReply;
            if (reply.status === "error") {
                reject(reply.result);
            } else {
                resolve(reply.result);
            }
        };

        emitter.on("firebot-comm", waiter);
        sender.send("firebot-comm", invocation);
    });
}

const processInvoke = async function (message: IpcMessageInvoke) {
    const reply = <IpcMessageReply>{
        type: "reply",
        status: "error",
        result: "communicator processing error",
        id: message.id,
    };

    if (methods[message.name as keyof IpcMethods] == null) {
        reply.result = "method not registered";
    } else {
        try {
            reply.result = await methods[message.name as keyof IpcMethods](
                ...message.data
            );
            reply.status = "ok";
        } catch (e: any) {
            console.error(e);
            reply.result = e.message;
        }
    }

    sender.send("firebot-comm", reply);
};

export function init(ipcEmitter: IpcEmitter, ipcSender: IpcSender) {
    emitter = ipcEmitter;
    sender = ipcSender;

    emitter.on("firebot-comm", (sender, message: IpcMessage): void => {
        if (message.type === "event" && message.id === 0) {
            processEvent(message as never);
        } else if (message.type === "invoke" && message.id > 0) {
            processInvoke(message as never);
        }
    });
}

export function ready(): boolean {
    return emitter != null || sender != null;
}