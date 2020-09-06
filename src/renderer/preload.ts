import { ipcRenderer } from "electron";
import { Communicator } from "Utilities";

(<any>window).__firebotCommunicator = new Communicator(ipcRenderer, ipcRenderer.send);
