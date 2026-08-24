import type { OverlayWidgetType, OverlayWidgetConfig, FontOptions, Animation } from "../../../../types";
import { loadComponentExtension } from "../../builtin-widget-helpers";

export const ROTATING_TEXT_TYPE_ID = "firebot:rotating-text";

export type RotatingTextSettings = {
    texts: string[];
    intervalSeconds: number;
    randomizeOrder: boolean;
    fontOptions?: FontOptions;
    horizontalAlignment: "left" | "center" | "right";
    verticalAlignment: "top" | "center" | "bottom";
    backgroundColor: string;
    backgroundBorderRadius: number;
    addDropShadow: boolean;
    textEnterAnimation: Animation;
    textExitAnimation: Animation;
};

export type RotatingTextState = Record<string, never>;

export type RotatingTextWidgetConfig = OverlayWidgetConfig<RotatingTextSettings, RotatingTextState>;

export const rotatingText: OverlayWidgetType<RotatingTextSettings, RotatingTextState> = {
    id: ROTATING_TEXT_TYPE_ID,
    name: "Rotating Text",
    description: "Cycles through a list of texts on an interval, with entry/exit animations for each text as it rotates in and out.",
    icon: "fa-text",
    // The texts list is managed via the "Update Rotating Text" effect (add/remove/set)
    nonEditableSettings: ["texts"],
    settingsSchema: [
        {
            name: "texts",
            title: "Texts",
            description: "The list of texts to rotate through.",
            type: "editable-list",
            default: ["First message", "Second message", "Third message"],
            settings: {
                useTextArea: true,
                sortable: true,
                addLabel: "Add Text",
                editLabel: "Edit Text",
                noneAddedText: "No texts added yet"
            },
            allowReplaceVariables: true
        },
        {
            name: "intervalSeconds",
            title: "Rotation Interval (seconds)",
            description: "How long each text is shown before rotating to the next.",
            type: "number",
            default: 5,
            validation: {
                min: 1
            }
        },
        {
            name: "randomizeOrder",
            title: "Randomize Order",
            description: "Pick a random text each interval instead of cycling through them in order.",
            type: "boolean",
            default: false,
            showBottomHr: true
        },
        {
            name: "fontOptions",
            title: "Font Options",
            type: "font-options",
            default: {
                family: "Inter",
                weight: 600,
                size: 24,
                italic: false,
                color: "#FFFFFF"
            },
            allowAlpha: true
        },
        {
            name: "horizontalAlignment",
            title: "Horizontal Alignment",
            description: "Horizontal alignment of the text within the widget area.",
            type: "radio-cards",
            options: [{
                value: "left", label: "Left", iconClass: "fa-align-left"
            }, {
                value: "center", label: "Center", iconClass: "fa-align-center"
            }, {
                value: "right", label: "Right", iconClass: "fa-align-right"
            }],
            settings: {
                gridColumns: 3
            },
            default: "center"
        },
        {
            name: "verticalAlignment",
            title: "Vertical Alignment",
            description: "Vertical alignment of the text within the widget area.",
            type: "radio-cards",
            options: [{
                value: "top", label: "Top", iconClass: "fa-arrow-to-top"
            }, {
                value: "center", label: "Center", iconClass: "fa-border-center-h"
            }, {
                value: "bottom", label: "Bottom", iconClass: "fa-arrow-to-bottom"
            }],
            settings: {
                gridColumns: 3
            },
            default: "center"
        },
        {
            name: "backgroundColor",
            title: "Background Color",
            description: "Optional background panel color behind the text.",
            type: "hexcolor",
            default: "#00000000",
            allowAlpha: true
        },
        {
            name: "backgroundBorderRadius",
            title: "Background Border Radius",
            description: "Optional border radius (in pixels) for the background panel.",
            type: "number",
            default: 0,
            validation: {
                min: 0
            }
        },
        {
            name: "addDropShadow",
            title: "Add Drop Shadow",
            type: "boolean",
            default: false,
            showBottomHr: true
        },
        {
            name: "textEnterAnimation",
            title: "Text Entry Animation",
            description: "Animation used when a text rotates in.",
            type: "animation-select",
            animationType: "enter",
            default: { class: "fadeIn" }
        },
        {
            name: "textExitAnimation",
            title: "Text Exit Animation",
            description: "Animation used when a text rotates out.",
            type: "animation-select",
            animationType: "exit",
            default: { class: "fadeOut" }
        }
    ],
    initialAspectRatio: { width: 3, height: 1 },
    initialState: {},
    supportsLivePreview: true,
    livePreviewState: {},
    componentExtension: loadComponentExtension("rotating-text")
};
