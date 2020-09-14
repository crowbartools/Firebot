import { ipcRenderer } from "electron";
import { communicator } from "SharedUtils";

communicator.init(ipcRenderer, ipcRenderer);
window.fbComm = communicator;
