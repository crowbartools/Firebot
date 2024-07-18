import JsonDbManager from "../database/json-db-manager";
import frontendCommunicator from "../common/frontend-communicator";
import { VariableMacro } from "../../types/variable-macros";

class MacroManager extends JsonDbManager<VariableMacro> {
    constructor() {
        super("Variable Macro", "/variable-macros");
    }

    getMacroByName(name: string) {
        return this.getItemByName(name);
    }

    hasMacro(name: string) {
        return this.getItemByName(name) != null;
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("macros:updated");
    }
}

const manager = new MacroManager();

frontendCommunicator.onAsync("macros:getAll",
    async () => manager.getAllItems());

frontendCommunicator.onAsync("macros:save",
    async (newMacro: VariableMacro) => manager.saveItem(newMacro));

frontendCommunicator.on("macros:delete",
    (macroId: string) => manager.deleteItem(macroId));

export = manager;