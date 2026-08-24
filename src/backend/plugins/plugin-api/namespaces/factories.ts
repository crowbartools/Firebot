import type { PluginFactoriesApi } from "../../../../types/plugin-api";

import { definePluginApiNamespace } from "../internal/define-namespace";

import { createEventDataVariable } from "../../../variables/variable-factory";
import {
    createNumberFilter,
    createPresetFilter,
    createTextFilter,
    createTextOrNumberFilter
} from "../../../events/filters/filter-factory";

export const createFactoriesApi = definePluginApiNamespace<PluginFactoriesApi>(() => {
    return {
        variables: {
            createEventDataVariable(config) {
                return createEventDataVariable(config);
            }
        },
        eventFilters: {
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
        }
    };
});