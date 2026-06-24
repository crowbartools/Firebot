import type { ControlDeckControlType, EffectList } from "../../../types";

type SwitchParams = {
    orientation: "horizontal" | "vertical";
    color: string;
    initialState: "restore" | "off" | "on";
    runEffectsOnInit: boolean;
    onEffects: EffectList;
    offEffects: EffectList;
};

export const switchControlType: ControlDeckControlType<SwitchParams, boolean> = {
    id: "firebot:switch",
    name: "Switch",
    description: "A toggle switch that runs effects when turned on or off",
    icon: "fa-toggle-on",
    enableLabel: true,
    resizable: false,
    defaultSize: { width: 1, height: 1 },
    shell: "none",
    settingsSchema: [
        {
            name: "orientation",
            title: "Orientation",
            type: "radio-cards",
            default: "horizontal",
            options: [
                { value: "horizontal", label: "Horizontal", iconClass: "fa-arrows-h" },
                { value: "vertical", label: "Vertical", iconClass: "fa-arrows-v" }
            ],
            settings: {
                gridColumns: 2
            }
        },
        {
            name: "color",
            title: "On Color",
            type: "hexcolor",
            default: "#41c98a"
        },
        {
            name: "initialState",
            title: "On Firebot Startup",
            type: "radio-cards",
            default: "restore",
            options: [
                { value: "restore", label: "Restore", description: "Restore the last state" },
                { value: "off", label: "Off", description: "Always start Off" },
                { value: "on", label: "On", description: "Always start On" }
            ],
            settings: {
                gridColumns: 3
            }
        },
        {
            name: "runEffectsOnInit",
            title: "Run Effects On Startup",
            description: "When enabled, the matching effects run when the switch initializes its state on startup.",
            type: "boolean",
            useSwitch: true,
            default: false
        },
        {
            name: "onEffects",
            title: "On Effects",
            type: "effectlist"
        },
        {
            name: "offEffects",
            title: "Off Effects",
            type: "effectlist"
        }
    ],
    state: {
        getInitialState: async ({ control, persistedState }, { triggerEffectList }) => {
            const mode = control.settings?.initialState ?? "restore";
            let value: boolean;
            if (mode === "on") {
                value = true;
            } else if (mode === "off") {
                value = false;
            } else {
                value = persistedState ?? false;
            }

            if (control.settings?.runEffectsOnInit === true) {
                await triggerEffectList(value ? control.settings.onEffects : control.settings.offEffects);
            }

            return value;
        }
    },
    onInteraction: async ({ control, action, data }, { getState, setState, triggerEffectList }) => {
        if (action !== "toggle") {
            return;
        }
        const next = typeof data === "boolean" ? data : !(getState() === true);
        await setState(next);
        await triggerEffectList(next ? control.settings?.onEffects : control.settings?.offEffects);
    }
};
