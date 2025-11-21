import overlayWidgetsManager from "./overlay-widgets-manager";
import widgetTypes from "./builtin-types";

export function loadWidgetTypes() {
    for (const widgetType of widgetTypes) {
        overlayWidgetsManager.registerOverlayWidgetType(widgetType);
    }
}