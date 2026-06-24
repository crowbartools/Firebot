import type { PluginPluginsApi } from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";

export const createPluginsApi = definePluginApiNamespace<PluginPluginsApi>(() => {
    return {
        async getInstalledPlugins() {
            const { PluginManager } = await import("../../plugin-manager");
            return PluginManager.getInstalledPlugins();
        }
    };
});
