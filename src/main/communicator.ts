import { ipcMain } from "electron";
import { IpcSend, Communicator } from "Utilities";

let comm: Communicator;
export default (send?: IpcSend): Communicator => {
    if (send == null) {
        if (comm) {
            return comm;
        }
        throw new Error("communicator not initialized for main process");
    }

    comm = new Communicator(ipcMain, send);
    return comm;
};
