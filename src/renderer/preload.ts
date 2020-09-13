import { ipcRenderer } from "electron";
import { Communicator } from "SharedUtilities";

window.fbComm = new Communicator(ipcRenderer, ipcRenderer);
