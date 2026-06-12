import type { PluginEventFilterFactoryApi } from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";
import { createTextFilter, createNumberFilter, createTextOrNumberFilter, createPresetFilter } from "../../../events/filters/filter-factory";

export const createEventFilterFactoryApi = definePluginApiNamespace<PluginEventFilterFactoryApi>(() => {
    return {
        createTextFilter(config) {
            return createTextFilter(config);
        },
        createNumberFilter(config) {
            return createNumberFilter(config);
        },
        createTextOrNumberFilter(config) {
            return createTextOrNumberFilter(config);
        },
        createPresetFilter(config) {
            return createPresetFilter(config);
        }
    };
});
