import type { ControlDeckControlType, EffectList } from "../../../types";

import { CONTROL_DECK_BUTTON_TYPE_ID } from "../../../types/control-deck";

type ButtonParams = {
    effects: EffectList;
};

export const buttonControlType: ControlDeckControlType<ButtonParams> = {
    id: CONTROL_DECK_BUTTON_TYPE_ID,
    name: "Button",
    description: "A button that runs effects when pressed",
    icon: "fa-square",
    enableIcon: true,
    enableBackground: true,
    enableInputs: true,
    enableLabel: true,
    settingsSchema: [
        {
            name: "effects",
            title: "On Press",
            type: "effectlist",
            default: undefined
        }
    ],
    onInteraction: async ({ control, action }, { triggerEffectList }) => {
        if (action !== "press" || control.settings?.effects == null) {
            return;
        }
        await triggerEffectList(control.settings.effects);
    }
};
