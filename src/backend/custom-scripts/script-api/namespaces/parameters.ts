import type { ScriptParametersApi } from "../../../../types/script-api";
import { defineScriptApiNamespace } from "../internal/define-namespace";

import { PluginConfigManager } from "../../plugin-config-manager";

export const createParametersApi = defineScriptApiNamespace<ScriptParametersApi>((ctx) => {
    function getParameters(): Record<string, unknown> {
        if (ctx.pluginId == null) {
            return {};
        }
        const config = PluginConfigManager.getItem(ctx.pluginId);
        return config?.parameters ?? {};
    }

    return {
        getAll<T extends Record<string, unknown> = Record<string, unknown>>(): T {
            return { ...getParameters() } as T;
        }
    };
});
