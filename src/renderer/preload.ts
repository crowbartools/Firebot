import { ipcRenderer } from "electron";
import { Communicator } from "SharedUtils";

window.fbComm = new Communicator(ipcRenderer, ipcRenderer);
