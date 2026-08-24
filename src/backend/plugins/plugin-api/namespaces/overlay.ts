import type { PluginOverlayApi } from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";

import overlayWidgetConfigManager from "../../../overlay-widgets/overlay-widget-config-manager";

export const createOverlayApi = definePluginApiNamespace<PluginOverlayApi>(() => {
    return {
        widgets: {
            getConfigsOfType(typeId) {
                return overlayWidgetConfigManager.getConfigsOfType(typeId);
            },

            getWidgetState(widgetId) {
                return overlayWidgetConfigManager.getWidgetStateById(widgetId);
            },

            setWidgetState(widgetId, state, persist = true) {
                return overlayWidgetConfigManager.setWidgetStateById(widgetId, state, persist);
            }
        }
    };
});