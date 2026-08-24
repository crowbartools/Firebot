import type { PluginParametersApi } from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";

import { PluginConfigManager } from "../../plugin-config-manager";

export const createParametersApi = definePluginApiNamespace<PluginParametersApi>((ctx) => {
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
