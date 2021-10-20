import { makeAutoObservable } from "mobx";
import {} from "mobx-utils";
import { FirebotCustomCommand } from "SharedTypes/command";
import { communicator } from "../utils";
class CommandStore {
    customCommands: FirebotCustomCommand[] = [];

    constructor() {
        makeAutoObservable(this);
        this.loadCustomCommands();
    }

    private *loadCustomCommands() {
        this.customCommands = yield communicator.invoke("getCustomCommands");
    }
}

export const commandStore = new CommandStore();
