import { FontOptions } from "../../../../types/parameters";
import { OverlayWidgetType, OverlayWidgetConfig, IOverlayWidgetEventUtils } from "../../../../types/overlay-widgets";
import { WidgetOverlayEvent } from "../../../../types/overlay-widgets";
import { Duration } from "luxon";
import frontendCommunicator from "../../../common/frontend-communicator";
import logger from "../../../logwrapper";
import type { EffectList } from "../../../../types/effects";

export type Settings = {
    fontOptions: FontOptions;
    alignment: "left" | "center" | "right";
    runWhenInactive?: boolean;
    onCompleteEffects?: EffectList;
};

export type State = {
    remainingSeconds: number;
    mode: "running" | "paused";
};

export type DynamicCountdownWidgetConfig = OverlayWidgetConfig<Settings, State> & {
    type: "firebot:countdown-dynamic";
};

export const dynamicCountdown: OverlayWidgetType<Settings, State> = {
    id: "firebot:countdown-dynamic",
    name: "Countdown Timer (Dynamic)",
    description: "A countdown timer that can be controlled and updated dynamically via effects (e.g. for subathons)",
    icon: "fa-hourglass-half",
    settingsSchema: [
        {
            name: "fontOptions",
            title: "Font Options",
            description: "Customize the countdown display.",
            type: "font-options",
            default: {
                family: "Inter",
                weight: 400,
                size: 48,
                italic: false,
                color: "#FFFFFF"
            },
            allowAlpha: true
        },
        {
            name: "alignment",
            title: "Text Alignment",
            description: "Alignment of the countdown text within the widget area.",
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
            default: "center",
            showBottomHr: true
        },
        {
            name: "runWhenInactive",
            title: "Run When Inactive",
            description: "Whether the countdown should continue running when the widget is not active (visible).",
            type: "boolean",
            default: false
        },
        {
            name: "onCompleteEffects",
            title: "On Complete Effects",
            description: "Effects to run when the countdown reaches zero.",
            type: "effectlist"
        }
    ],
    nonEditableSettings: ["onCompleteEffects"],
    initialState: {
        remainingSeconds: 0,
        mode: "paused"
    },
    supportsLivePreview: true,
    livePreviewState: {
        remainingSeconds: 248660, // 69 hours, 04 minutes, and 20 seconds (nice)
        mode: "paused"
    },
    stateDisplay: (config) => {
        const duration = Duration.fromDurationLike({ seconds: Math.round(config.state?.remainingSeconds ?? 0) }).rescale();
        const secondsDisplay = duration.shiftTo("hours", "minutes", "seconds").toFormat("hh:mm:ss");
        return `${secondsDisplay} (${config.state?.mode ?? 'paused'})`;
    },
    uiActions: [
        {
            id: "toggle",
            label: "Start/Pause",
            icon: "fa-play-circle",
            click: (config) => {
                if ((config.state?.remainingSeconds ?? 0) > 0) {
                    return {
                        newState: {
                            ...config.state,
                            mode: config.state.mode === "running" ? "paused" : "running"
                        },
                        persistState: true
                    };
                }
            }
        },
        {
            id: "add-time",
            label: "Add Time",
            icon: "fa-plus-circle",
            click: async (config) => {
                const seconds = await frontendCommunicator.fireEventAsync<number>("openGetInputModal", {
                    config: {
                        model: config.state?.remainingSeconds ?? 0,
                        inputType: "number",
                        label: "Add Seconds",
                        saveText: "Save",
                        descriptionText: "Enter number of seconds to add to the countdown. Can be negative to subtract time.",
                        inputPlaceholder: "Enter number",
                        validationText: 'Please enter a valid number.'
                    },
                    validation: {
                        required: true
                    }
                });

                if (seconds == null) {
                    return;
                }

                logger.debug(`Adding ${seconds} seconds to timer "${config.name}"`);

                const newRemaining = Math.max(0, (config.state?.remainingSeconds ?? 0) + Number(seconds));

                return {
                    newState: {
                        ...config.state,
                        remainingSeconds: newRemaining
                    }
                };
            }
        },
        {
            id: "set-time",
            label: "Set Time",
            icon: "fa-clock",
            click: async (config) => {
                const seconds = await frontendCommunicator.fireEventAsync("openGetInputModal", {
                    config: {
                        model: 0,
                        inputType: "number",
                        label: "Set Time",
                        saveText: "Save",
                        descriptionText: "Enter the total seconds for the countdown. The countdown will be set to this value.",
                        inputPlaceholder: "Enter number",
                        validationText: 'Please enter a valid number.'
                    },
                    validation: {
                        required: true
                    }
                });

                if (seconds == null) {
                    return;
                }

                const newRemaining = Math.max(0, Number(seconds));

                return {
                    newState: {
                        ...config.state,
                        remainingSeconds: newRemaining,
                        mode: newRemaining === 0 ? "paused" : config.state?.mode ?? "paused"
                    }
                };
            }
        }
    ],
    overlayExtension: {
        eventHandler: (event: WidgetOverlayEvent<Settings, State>, utils: IOverlayWidgetEventUtils) => {
            const generateWidgetHtml = (config: typeof event["data"]["widgetConfig"]) => {
                const remainingSeconds = config.state?.remainingSeconds ?? 0;

                // show time as hh:mm:ss
                const hours = Math.floor(remainingSeconds / 3600);
                const minutes = Math.floor((remainingSeconds % 3600) / 60);
                const seconds = remainingSeconds % 60;
                const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                const containerStyles = {
                    "font-family": (config.settings?.fontOptions?.family ? `'${config.settings?.fontOptions?.family}'` : 'Inter, sans-serif'),
                    "font-size": (config.settings?.fontOptions?.size ? `${config.settings.fontOptions.size}px` : '48px'),
                    "font-weight": config.settings?.fontOptions?.weight?.toString() || '400',
                    "font-style": config.settings?.fontOptions?.italic ? 'italic' : 'normal',
                    "color": config.settings?.fontOptions?.color || '#FFFFFF',
                    "width": "100%",
                    "height": "100%",
                    "overflow": "hidden",
                    "display": "flex",
                    "align-items": "center",
                    "justify-content": config.settings?.alignment === 'left' ? 'flex-start' : config.settings?.alignment === 'right' ? 'flex-end' : 'center'
                };

                return `
                <div id="countdown-container" style="${utils.stylesToString(containerStyles)}">
                    <div id="time-remaining">
                        ${timeString}
                    </div>
                </div>`;
            };

            utils.handleOverlayEvent(generateWidgetHtml);
        }
    }
};
