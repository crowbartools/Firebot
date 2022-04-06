import commandSettings from "./command-settings";
import { FirebotCustomCommand } from "SharedTypes/command";
import { registerIpcMethods } from "../../utils";

@registerIpcMethods(
    "getCustomCommands",
    "saveCustomCommand",
    "deleteCustomCommand"
)
class CommandManager {
    private commands: FirebotCustomCommand[];

    constructor() {
        this.commands = commandSettings.get("customCommands");
    }

    getCustomCommands() {
        return this.commands;
    }

    saveCustomCommand(command: FirebotCustomCommand) {
        this.commands.push(command);
        commandSettings.set("customCommands", this.commands);
    }

    deleteCustomCommand(id: string) {
        this.commands = this.commands.filter((c) => c.id === id);
        commandSettings.set("customCommands", this.commands);
    }
}

export default new CommandManager();
