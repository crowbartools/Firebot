import type { PluginSettingsApi } from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";
import { SettingsManager } from "../../../common/settings-manager";

export const createSettingsApi = definePluginApiNamespace<PluginSettingsApi>(() => {
    return {
        getSetting(settingName) {
            return SettingsManager.getSetting(settingName);
        }
    };
});
