import type { Component } from "vue";

import buttonControl from "./button.mjs";
import folderControl from "./folder.mjs";
import switchControl from "./switch.mjs";

export const FOLDER_CONTROL_TYPE_ID = "firebot:folder";

export interface ControlTypeEntry {
    component: Component;
}

export const controlTypeRegistry: Record<string, ControlTypeEntry> = {
    "firebot:button": {
        component: buttonControl
    },
    [FOLDER_CONTROL_TYPE_ID]: {
        component: folderControl
    },
    "firebot:switch": {
        component: switchControl
    }
};
