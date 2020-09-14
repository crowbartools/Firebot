import { ipcMain, WebContents } from "electron";
import { Communicator } from "SharedUtils";

let whenReadyCb: VoidFunction;
let whenReadyPromise: Promise<void>;

let comm: Communicator;
export default (sender?: WebContents): Communicator => {
    if (sender == null) {
        if (comm) {
            return comm;
        }
        throw new Error("communicator not initialized for main process");
    }

    comm = new Communicator(ipcMain, sender);

    if (whenReadyCb != null) {
        whenReadyCb();
        whenReadyCb = null;
        whenReadyPromise = null;
    }

    return comm;
};

export function whenCommunicatorIsReady(): Promise<void> {
    if (comm != null) {
        return Promise.resolve();
    }
    if (whenReadyPromise == null) {
        whenReadyPromise = new Promise((resolve) => {
            whenReadyCb = () => {
                resolve();
            };
        });
    }
    return whenReadyPromise;
}

export function communicatorIsReady(): boolean {
    return comm != null;
}
