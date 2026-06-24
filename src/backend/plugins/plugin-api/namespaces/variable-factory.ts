import type { PluginVariableFactoryApi } from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";
import { createEventDataVariable } from "../../../variables/variable-factory";

export const createVariableFactoryApi = definePluginApiNamespace<PluginVariableFactoryApi>(() => {
    return {
        createEventDataVariable(config) {
            return createEventDataVariable(config);
        }
    };
});
