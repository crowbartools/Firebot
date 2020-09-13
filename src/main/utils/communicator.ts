import { ipcMain, WebContents } from "electron";
import { Communicator } from "SharedUtilities";

let comm: Communicator;
export default (sender?: WebContents): Communicator => {
    if (sender == null) {
        if (comm) {
            return comm;
        }
        throw new Error("communicator not initialized for main process");
    }

    comm = new Communicator(ipcMain, sender);
    return comm;
};
