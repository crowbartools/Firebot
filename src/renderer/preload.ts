import { ipcRenderer } from "electron";
import { Communicator } from "Utilities";

window.fbComm = new Communicator(ipcRenderer, ipcRenderer);
