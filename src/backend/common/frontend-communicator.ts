import { ipcMain } from "electron";
import { v4 as uuid } from "uuid";

import { FrontendCommunicatorModule } from "../../types/script-modules";

class FrontendCommunicator implements FrontendCommunicatorModule {
    private _listeners = {};

    private registerEventWithElectron(eventName: string): void {
        ipcMain.on(eventName, (event, data) => {
            const eventListeners = this._listeners[eventName];
            for (const listener of eventListeners) {
                if (listener.async) {
                    listener.callback(data).then((returnValue: unknown) => {
                        this.send(`${eventName}:reply`, returnValue);
                    });
                } else {
                    const returnValue = listener.callback(data);
                    event.returnValue = returnValue;
                }
            }
        });
    }

    send(eventName: string, data?: unknown): void {
        if (globalThis.renderWindow?.webContents?.isDestroyed() === false) {
            globalThis.renderWindow.webContents.send(eventName, data);
        }
    }

    fireEventAsync<ReturnPayload = void>(type: string, data?: unknown): Promise<ReturnPayload> {
        return new Promise((resolve) => {
            if (globalThis.renderWindow != null) {
                ipcMain.once(`${type}:reply`, (_, eventData) => {
                    resolve(eventData);
                });
                globalThis.renderWindow.webContents.send(type, data);
            }
        });
    }

    private registerListener<ExpectedArgs extends Array<unknown> = [], ReturnPayload = void>(
        eventName: string,
        callback: (...args: ExpectedArgs) => ReturnPayload,
        async = false
    ): string {
        const id = uuid(),
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
}

const frontendCommunicator = new FrontendCommunicator();

export = frontendCommunicator;