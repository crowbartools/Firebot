import IpcEvents from "Typings/ipc-events";
import IpcMethods from "Typings/ipc-methods";

import { jsonClone, wildcard } from "Utilities";
import { WebContents, IpcRenderer } from "electron";

export interface IpcMessage {
    type: "event" | "invoke" | "reply";
    name: string;
    id: number;
}
export interface IpcMessageEvent extends IpcMessage {
    type: "event";
    data: any;
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

interface Listener {
    handler: (data: IpcMessageEvent) => void;
    once: boolean;
}
interface Method {
    (data: any): any;
}

type IpcSender = WebContents | IpcRenderer;

export class Communicator {
    private emitter: IpcEmitter;

    private sender: IpcSender;

    private listeners: Record<string, Listener[]> = {};

    private methods: Record<string, Method> = {};

    private msgId = 0;

    constructor(ipcEmitter: IpcEmitter, sender: IpcSender) {
        this.emitter = ipcEmitter;
        this.sender = sender;

        this.emitter.on("firebot-comm", (sender, message: IpcMessage): void => {
            if (message.type === "event" && message.id === 0) {
                this.processEvent(<IpcMessageEvent>message);
            } else if (message.type === "invoke" && message.id > 0) {
                this.processInvoke(<IpcMessageInvoke>message);
            }
        });
    }

    on<E extends keyof IpcEvents>(event: E, handler: (event: IpcEvents[E]) => void, once = false): void {
        if (this.listeners[event] == null) {
            this.listeners[event] = [];
        }

        this.listeners[event].push({
            handler,
            once,
        });
    }

    once<E extends keyof IpcEvents>(event: E, handler: (event: IpcEvents[E]) => void): void {
        this.on(event, handler, true);
    }

    off<E extends keyof IpcEvents>(event: E, handler: (event: IpcEvents[E]) => void, once = false): void {
        if (this.listeners[event]?.length === 0) {
            this.listeners[event] = null;
        }

        if (this.listeners[event] != null) {
            let i = 0;
            while (i < this.listeners[event].length) {
                const listener = this.listeners[event][i];

                if (listener.handler === handler && listener.once === once) {
                    this.listeners[event].splice(i, 1);
                    if (this.listeners[event].length === 0) {
                        this.listeners[event] = null;
                    }
                    break;
                }
                i += 1;
            }
        }
    }

    offOnce<E extends keyof IpcEvents>(event: E, handler: (event: IpcEvents[E]) => void): void {
        this.off(event, handler, true);
    }

    emit<E extends keyof IpcEvents>(event: E, data: IpcEvents[E]): void {
        this.sender.send("firebot-comm", <IpcMessageEvent>{
            type: "event",
            name: event,
            data,
            id: 0,
        });
    }

    private processEvent(event: IpcMessageEvent) {
        if (this.listeners[event.name] != null) {
            // static listeners get priority
            const listeners = this.listeners[event.name];
            let i = 0;
            while (i < listeners.length) {
                const { handler, once } = listeners[i];

                try {
                    handler(jsonClone(event.data));

                    if (once === true) {
                        listeners.splice(i, 1);
                    } else {
                        i += 1;
                    }
                } catch (err) {
                    console.log(`Error From Communicator Listener of ${event.name}`, err);
                    listeners.splice(i, 1);
                }
            }
        } else if (event.name.indexOf("?") === -1 && event.name.indexOf("*") === -1) {
            // Get a list of events that have listeners
            Object.keys(this.listeners)
                .filter((key) => {
                    // first the event names that are not wildcards
                    if (key.indexOf("*") === -1 && key.indexOf("?") === -1) {
                        return false;
                    }

                    // filter out wildcard event names that do not match the event
                    return wildcard(key).test(event.name);
                })

                // loop over the remaining list of event names and call the processor for them
                .forEach((key) => {
                    event.name = key;
                    this.processEvent(event);
                });
        }
    }

    register<M extends keyof IpcMethods>(method: M, handler: (data: IpcMethods[M]['request']) => Promise<IpcMethods[M]['response']>): void {
        if (this.methods[method] != null) {
            throw new Error("method already registered");
        }

        this.methods[method] = handler;
    }

    unregister<M extends keyof IpcMethods>(method: M, handler: (data: IpcMethods[M]) => Promise<any>): void {
        if (this.methods[method] == null) {
            throw new Error(`method '${method}' not registered`);
        }
        if (this.methods[method] !== handler) {
            throw new Error(`handler for '${method}' does not match given handler`);
        }

        this.methods[method] = null;
    }

    // how to document the promise?
    invoke<M extends keyof IpcMethods>(method: M, data: IpcMethods[M]['request']): Promise<IpcMethods[M]['response']> {
        this.msgId += 1;
        const invocation: IpcMessageInvoke = {
            type: "invoke",
            name: method,
            data,
            id: this.msgId,
        };

        return new Promise((resolve, reject) => {
            const waiter = (sender: any, message: IpcMessage) => {
                if (message.type !== "reply" || message.id !== invocation.id) {
                    return;
                }

                this.emitter.off("firebot-comm", waiter);

                const reply = message as IpcMessageReply;
                if (reply.status === "error") {
                    reject(reply.result);
                } else {
                    resolve(reply.result);
                }
            };

            this.emitter.on("firebot-comm", waiter);
            this.sender.send("firebot-comm", invocation);
        });
    }

     private async processInvoke(message: IpcMessageInvoke) {
        const reply = <IpcMessageReply>{
            type: "reply",
            status: "error",
            result: "communicator processing error",
            id: message.id,
        };

        if (this.methods[message.name] == null) {
            reply.result = "method not registered";
        } else {
            try {
                reply.result = await this.methods[message.name](message.data);
                reply.status = "ok";
            } catch (e) {
                reply.result = e.message;
            }
        }

        this.sender.send("firebot-comm", reply);
    }
}
