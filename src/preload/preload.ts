import { ipcRenderer, contextBridge } from "electron";
import { communicator } from "SharedUtils";

communicator.init(ipcRenderer, ipcRenderer);

contextBridge.exposeInMainWorld("FirebotCommunicator", communicator);
