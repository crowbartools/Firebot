import { ipcMain } from "electron";
import { randomUUID } from "crypto";

import type {
    FrontendCommunicatorModule,
    Awaitable
} from "../../types";

class FrontendCommunicator implements FrontendCommunicatorModule {
    private _listeners: Record<string, {
        id: string;
        callback: (...args: Array<unknown>) => Awaitable<unknown>;
        async: boolean;
    }[]> = {};

    private registerEventWithElectron(eventName: string): void {
        ipcMain.on(eventName, (event, data) => {
            const eventListeners = this._listeners[eventName];
            for (const listener of eventListeners) {
                if (listener.async) {
                    (listener.callback(data) as Promise<unknown>)
                        .then((returnValue: unknown) => {
                            this.send(`${eventName}:reply`, returnValue);
                        }, () => {});
                } else {
                    const returnValue = listener.callback(data);
                    event.returnValue = returnValue;
                }
            }
        });
    }

    send<ExpectedArg = unknown>(eventName: string, data?: ExpectedArg): void {
        if (globalThis.renderWindow?.isDestroyed() === false
            && globalThis.renderWindow?.webContents?.isDestroyed() === false) {
            globalThis.renderWindow.webContents.send(eventName, data);
        }
    }

    sendToVariableInspector(eventName: string, data?: unknown): void {
        if (globalThis.variableInspectorWindow?.isDestroyed() === false
            && globalThis.variableInspectorWindow?.webContents?.isDestroyed() === false) {
            globalThis.variableInspectorWindow.webContents.send(eventName, data);
        }
    }

    fireEventAsync<ReturnPayload = void, ExpectedArg = unknown>(eventName: string, data?: ExpectedArg): Promise<ReturnPayload> {
        return new Promise((resolve) => {
            if (globalThis.renderWindow != null) {
                ipcMain.once(`${eventName}:reply`, (_, eventData) => {
                    resolve(eventData as ReturnPayload);
                });
                globalThis.renderWindow.webContents.send(eventName, data);
            }
        });
    }

    private registerListener<ExpectedArgs extends Array<unknown> = [], ReturnPayload = void>(
        eventName: string,
        callback: (...args: ExpectedArgs) => ReturnPayload,
        async = false
    ): string {
        const id = randomUUID(),
            event = {
                id: id,
                callback: callback,
                async: async
            };

        if (this._listeners.hasOwnProperty(eventName)) {
            this._listeners[eventName].push(event);
        } else {
            this._listeners[eventName] = [event];
            this.registerEventWithElectron(eventName);
        }

        return id;
    }

    on<ExpectedArgs extends Array<unknown> = [], ReturnPayload = void> (
        eventName: string,
        callback: (...args: ExpectedArgs) => ReturnPayload
    ): string {
        return this.registerListener(eventName, callback, false);
    }

    onAsync<ExpectedArgs extends Array<unknown> = [], ReturnPayload = void>(
        eventName: string,
        callback: (...args: ExpectedArgs) => Promise<ReturnPayload>
    ): string {
        return this.registerListener(eventName, callback, true);
    }

    private unregisterListener(eventName: string, id: string) {
        this._listeners[eventName] = this._listeners[eventName].filter(l => l.id !== id);
    }

    off(eventName: string, id: string): void {
        this.unregisterListener(eventName, id);
    }
}

const frontendCommunicator = new FrontendCommunicator();

export = frontendCommunicator;