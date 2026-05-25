import { EffectList } from "../../../../types/effects";
import { OverlayWidgetType, IOverlayWidgetEventUtils, WidgetOverlayEvent } from "../../../../types/overlay-widgets";
import { FontOptions } from "../../../../types/parameters";
import effectRunner from "../../../common/effect-runner";
import { Trigger } from "../../../../types/triggers";
import logger from "../../../logwrapper";

type Settings = {
    title?: string;
    titleFontOptions?: FontOptions;
    barColor: string;
    trackColor: string;
    orientation: "horizontal" | "vertical";
    horizontalFillDirection: "left-to-right" | "right-to-left";
    verticalFillDirection: "bottom-to-top" | "top-to-bottom";
    endCapStyle: "rounded" | "squared";
    currentValueDisplay: "hide" | "raw" | "percentage";
    showMaxValue: boolean;
    valuePrefix?: string;
    minValue: number;
    maxValue: number;
    onUpdateEffects?: EffectList;
    onCompleteEffects?: EffectList;
};

type State = {
    currentValue: number;
};

export const progressbar: OverlayWidgetType<Settings, State> = {
    id: "firebot:progressbar",
    name: "Progress Bar",
    description: "A simple progress bar that can be updated via commands or variables.",
    icon: "fa-percentage",
    settingsSchema: [
        {
            name: "title",
            title: "Title",
            type: "string",
            default: "Progress Bar",
            validation: {
                required: false
            }
        },
        {
            name: "currentValueDisplay",
            title: "Current Value Display",
            description: "How to display the current value in the center of the bar.",
            type: "radio-cards",
            options: [
                { value: "hide", label: "Hide", iconClass: "fa-eye-slash" },
                { value: "raw", label: "Raw Value", iconClass: "fa-hashtag" },
                { value: "percentage", label: "Percentage", iconClass: "fa-percent" }
            ],
            settings: {
                gridColumns: 3
            },
            default: "hide",
            validation: {
                required: true
            }
        },
        {
            name: "showMaxValue",
            title: "Show Max Value",
            description: "Display the maximum value at the end of the bar.",
            type: "boolean",
            default: false
        },
        {
            name: "valuePrefix",
            title: "Value Prefix",
            description: "Optional prefix to display before values (e.g. $, #, etc.). Not shown when displaying percentage.",
            type: "string",
            default: "",
            validation: {
                required: false
            }
        },
        {
            name: "titleFontOptions",
            title: "Font Options",
            type: "font-options",
            default: {
                family: "Inter",
                weight: 600,
                size: 24,
                italic: false,
                color: "#FFFFFF"
            },
            allowAlpha: true,
            showBottomHr: true
        },
        {
            name: "trackColor",
            title: "Track Color",
            type: "hexcolor",
            allowAlpha: true,
            default: "#000000",
            validation: {
                required: true,
                pattern: "^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$"
            }
        },
        {
            name: "barColor",
            title: "Bar Color",
            type: "hexcolor",
            allowAlpha: true,
            default: "#00FF00",
            validation: {
                required: true,
                pattern: "^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$"
            }
        },
        {
            name: "endCapStyle",
            title: "End Cap Style",
            description: "The shape of the bar's ends.",
            type: "radio-cards",
            options: [
                { value: "rounded", label: "Rounded", iconClass: "fa-circle" },
                { value: "squared", label: "Squared", iconClass: "fa-square" }
            ],
            settings: {
                gridColumns: 2
            },
            default: "rounded",
            validation: {
                required: true
            },
            showBottomHr: true
        },
        {
            name: "orientation",
            title: "Bar Orientation",
            description: "The overall orientation of the progress bar.",
            type: "radio-cards",
            options: [
                { value: "horizontal", label: "Horizontal", iconClass: "fa-arrows-left-right" },
                { value: "vertical", label: "Vertical", iconClass: "fa-arrows-up-down" }
            ],
            settings: {
                gridColumns: 2
            },
            default: "horizontal",
            validation: {
                required: true
            }
        },
        {
            name: "horizontalFillDirection",
            title: "Fill Direction",
            description: "The direction the bar fills as progress increases.",
            type: "radio-cards",
            options: [
                { value: "left-to-right", label: "Left to Right", iconClass: "fa-arrow-right" },
                { value: "right-to-left", label: "Right to Left", iconClass: "fa-arrow-left" }
            ],
            settings: {
                gridColumns: 2
            },
            default: "left-to-right",
            validation: {
                required: true
            },
            showIf: {
                orientation: "horizontal"
            },
            showBottomHr: true
        },
        {
            name: "verticalFillDirection",
            title: "Fill Direction",
            description: "The direction the bar fills as progress increases.",
            type: "radio-cards",
            options: [
                { value: "bottom-to-top", label: "Bottom to Top", iconClass: "fa-arrow-up" },
                { value: "top-to-bottom", label: "Top to Bottom", iconClass: "fa-arrow-down" }
            ],
            settings: {
                gridColumns: 2
            },
            default: "bottom-to-top",
            validation: {
                required: true
            },
            showIf: {
                orientation: "vertical"
            },
            showBottomHr: true
        },
        {
            name: "minValue",
            title: "Minimum Value",
            type: "number",
            default: 0,
            validation: {
                required: true
            }
        },
        {
            name: "maxValue",
            title: "Maximum Value",
            type: "number",
            default: 100,
            validation: {
                required: true
            },
            showBottomHr: true
        },
        {
            name: "onUpdateEffects",
            title: "On Update Effects",
            description: "Effects to run when the progress bar value is updated.",
            type: "effectlist",
            showBottomHr: true
        },
        {
            name: "onCompleteEffects",
            title: "On Complete Effects",
            description: "Effects to run when the progress bar reaches its maximum value.",
            type: "effectlist"
        }
    ],
    nonEditableSettings: ["onCompleteEffects", "onUpdateEffects"],
    initialAspectRatio: { width: 16, height: 2 },
    initialState: {
        currentValue: 0
    },
    supportsLivePreview: true,
    livePreviewState: {
        currentValue: 50
    },
    onStateUpdate(config) {
        // Only act if currentValue has changed
        if (config.state?.currentValue === config.previousState?.currentValue) {
            return;
        }

        // Check if we've reached or exceeded maxValue and previous value was below maxValue
        if (config.state?.currentValue != null &&
            config.settings?.maxValue != null &&
            config.state.currentValue >= config.settings.maxValue &&
            (config.previousState?.currentValue ?? 0) < config.settings.maxValue) {
            const effectList = config.settings?.onCompleteEffects;

            const processEffectsRequest = {
                trigger: {
                    type: "overlay_widget",
                    metadata: {
                        username: "Firebot",
                        progressBarWidgetId: config.id,
                        progressBarWidgetName: config.name
                    }
                } as Trigger,
                effects: effectList
            };

            effectRunner.processEffects(processEffectsRequest).catch((reason) => {
                logger.error(`Error when running effects: ${reason}`);
            });
        // if we haven't reached maxValue, run onUpdateEffects
        } else if (config.state?.currentValue != null && config.settings?.maxValue != null && config.state.currentValue < config.settings.maxValue) {
            const effectList = config.settings?.onUpdateEffects;

            const processEffectsRequest = {
                trigger: {
                    type: "overlay_widget",
                    metadata: {
                        username: "Firebot",
                        progressBarWidgetId: config.id,
                        progressBarWidgetName: config.name
                    }
                } as Trigger,
                effects: effectList
            };

            effectRunner.processEffects(processEffectsRequest).catch((reason) => {
                logger.error(`Error when running effects: ${reason}`);
            });
        }
    },
    overlayExtension: {
        eventHandler: (event: WidgetOverlayEvent<Settings, State>, utils: IOverlayWidgetEventUtils) => {
            const generateWidgetHtml = (config: typeof event["data"]["widgetConfig"]) => {
                const currentValue = config.state?.currentValue ?? 0;
                const minValue = config.settings?.minValue ?? 0;
                const maxValue = config.settings?.maxValue ?? 100;
                const orientation = config.settings?.orientation ?? "horizontal";
                const isVertical = orientation === "vertical";

                // Determine fill direction based on orientation
                const horizontalFillDirection = config.settings?.horizontalFillDirection ?? "left-to-right";
                const verticalFillDirection = config.settings?.verticalFillDirection ?? "bottom-to-top";

                // Calculate percentage, ensuring it's between 0 and 100
                const currentPercentage = Math.min(
                    100,
                    Math.max(0, ((currentValue - minValue) / (maxValue - minValue)) * 100)
                );

                const containerStyles = {
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    "flex-direction": "column",
                    "justify-content": "center",
                    "align-items": "center"
                };

                const trackStyles: Record<string, string> = {
                    width: "100%",
                    height: "100%",
                    "background-color": config.settings?.trackColor || "#000000",
                    border: "1px solid #ccc",
                    "border-radius": config.settings?.endCapStyle === "squared" ? "0" : "100vh",
                    overflow: "hidden",
                    display: "flex",
                    position: "relative",
                    "text-shadow": "0 0 8px rgb(0 0 0 / 20%)"
                };

                const progressBarStyles: Record<string, string> = {
                    "background-color": config.settings?.barColor || "#00FF00"
                };

                // Base font styles shared by title, current value, and max value
                const baseFontStyles: Record<string, string> = {
                    "font-family": (config.settings?.titleFontOptions?.family ? `'${config.settings?.titleFontOptions?.family}'` : 'Inter, sans-serif'),
                    "font-size": (config.settings?.titleFontOptions?.size ? `${config.settings.titleFontOptions.size}px` : '48px'),
                    "font-weight": config.settings?.titleFontOptions?.weight?.toString() || '400',
                    "font-style": config.settings?.titleFontOptions?.italic ? 'italic' : 'normal',
                    "color": config.settings?.titleFontOptions?.color || '#FFFFFF',
                    "position": "absolute",
                    "z-index": "1",
                    "white-space": "nowrap",
                    "pointer-events": "none"
                };

                const titleStyles: Record<string, string> = { ...baseFontStyles };

                const currentValueStyles: Record<string, string> = {
                    ...baseFontStyles,
                    "top": "50%",
                    "left": "50%",
                    "transform": "translate(-50%, -50%)"
                };

                const maxValueStyles: Record<string, string> = { ...baseFontStyles };

                if (isVertical) {
                    // Vertical orientation
                    progressBarStyles.width = "100%";
                    progressBarStyles.height = `${currentPercentage}%`;
                    progressBarStyles.transition = "height 0.5s ease-in-out";

                    if (verticalFillDirection === "bottom-to-top") {
                        trackStyles["flex-direction"] = "column-reverse";
                        // Title at bottom, rotated
                        titleStyles["bottom"] = "8px";
                        titleStyles["left"] = "50%";
                        titleStyles["transform"] = "rotate(-90deg)";
                        titleStyles["transform-origin"] = "left";
                        // Max value at top
                        maxValueStyles["top"] = "8px";
                        maxValueStyles["left"] = "50%";
                        maxValueStyles["transform"] = "translateX(-50%)";
                    } else {
                        trackStyles["flex-direction"] = "column";
                        // Title at top, rotated
                        titleStyles["top"] = "8px";
                        titleStyles["left"] = "50%";
                        titleStyles["transform"] = "rotate(90deg)";
                        titleStyles["transform-origin"] = "left";
                        // Max value at bottom
                        maxValueStyles["bottom"] = "8px";
                        maxValueStyles["left"] = "50%";
                        maxValueStyles["transform"] = "translateX(-50%)";
                    }
                } else {
                    // Horizontal orientation
                    progressBarStyles.height = "100%";
                    progressBarStyles.width = `${currentPercentage}%`;
                    progressBarStyles.transition = "width 0.5s ease-in-out";

                    // Center vertically
                    titleStyles["top"] = "50%";
                    maxValueStyles["top"] = "50%";

                    if (horizontalFillDirection === "right-to-left") {
                        trackStyles["flex-direction"] = "row-reverse";
                        // Title justified to the right (start)
                        titleStyles["right"] = "16px";
                        titleStyles["transform"] = "translateY(-50%)";
                        // Max value justified to the left (end)
                        maxValueStyles["left"] = "16px";
                        maxValueStyles["transform"] = "translateY(-50%)";
                    } else {
                        trackStyles["flex-direction"] = "row";
                        // Title justified to the left (start)
                        titleStyles["left"] = "16px";
                        titleStyles["transform"] = "translateY(-50%)";
                        // Max value justified to the right (end)
                        maxValueStyles["right"] = "16px";
                        maxValueStyles["transform"] = "translateY(-50%)";
                    }
                }

                // Prepare display values
                const valuePrefix = config.settings?.valuePrefix || '';
                const currentValueDisplayMode = config.settings?.currentValueDisplay ?? "hide";
                const showMaxValue = config.settings?.showMaxValue ?? false;

                const currentValueDisplayText = currentValueDisplayMode === "percentage"
                    ? `${Math.round(currentPercentage)}%`
                    : `${valuePrefix}${currentValue}`;

                const maxValueDisplay = `${valuePrefix}${maxValue}`;

                return `
                <div id="progress-bar-container" style="${utils.stylesToString(containerStyles)}">
                    <div id="progress-bar-track" style="${utils.stylesToString(trackStyles)}">
                        ${config.settings?.title ? `<div id="progress-bar-title" style="${utils.stylesToString(titleStyles)}">${config.settings.title}</div>` : ''}
                        ${currentValueDisplayMode !== "hide" ? `<div id="progress-bar-current-value" style="${utils.stylesToString(currentValueStyles)}">${currentValueDisplayText}</div>` : ''}
                        ${showMaxValue ? `<div id="progress-bar-max-value" style="${utils.stylesToString(maxValueStyles)}">${maxValueDisplay}</div>` : ''}
                        <div id="progress-bar" style="${utils.stylesToString(progressBarStyles)}"></div>
                    </div>
                </div>
                `;
            };

            utils.handleOverlayEvent(generateWidgetHtml);
        }
    }
};
