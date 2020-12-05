import { observable } from "mobx";
import { actionAsync, task } from "mobx-utils";
import { FirebotCustomCommand } from "SharedTypes/command";
import { communicator } from "../utils";
class CommandStore {
    @observable customCommands: FirebotCustomCommand[] = [];

    constructor() {
        this.loadCustomCommands();
    }

    @actionAsync
    private async loadCustomCommands() {
        this.customCommands = await task(
            communicator.invoke("getCustomCommands")
        );
    }
}

export const commandStore = new CommandStore();
