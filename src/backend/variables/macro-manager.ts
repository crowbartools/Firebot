import type { VariableMacro } from "../../types/variable-macros";
import JsonDbManager from "../database/json-db-manager";
import frontendCommunicator from "../common/frontend-communicator";

class MacroManager extends JsonDbManager<VariableMacro> {
    constructor() {
        super("Variable Macro", "/variable-macros", "Variable Macros");

        frontendCommunicator.onAsync("macros:ui-service-ready",
            async () => this.triggerUiRefresh()
        );

        frontendCommunicator.onAsync("macros:get-all",
            async () => this.getAllItems());

        frontendCommunicator.onAsync("macros:save",
            async (macros: VariableMacro) => this.saveItem(macros));

        frontendCommunicator.onAsync("macros:save-all",
            async (macros: VariableMacro[]) => this.saveAllItems(macros));

        frontendCommunicator.on("macros:delete",
            (macroId: string) => this.deleteItem(macroId));
    }

    getMacroByName(name: string) {
        return this.getItemByName(name);
    }

    hasMacro(name: string) {
        return this.getItemByName(name) != null;
    }

    triggerUiRefresh(): void {
        this.logger.debug("Triggering UI refresh");
        frontendCommunicator.send("macros:updated", this.getAllItems());
    }
}

const manager = new MacroManager();

export = manager;