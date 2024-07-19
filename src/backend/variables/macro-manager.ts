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

frontendCommunicator.onAsync("macros:get-all",
    async () => manager.getAllItems());

frontendCommunicator.onAsync("macros:save",
    async (macros: VariableMacro) => manager.saveItem(macros));

frontendCommunicator.onAsync("macros:save-all",
    async (macros: VariableMacro[]) => manager.saveAllItems(macros));

frontendCommunicator.on("macros:delete",
    (macroId: string) => manager.deleteItem(macroId));

export = manager;