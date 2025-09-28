import { OverlayWidgetType, IOverlayWidgetUtils, WidgetOverlayEvent } from "../../../types/overlay-widgets";
import { FontOptions } from "../../../types/parameters";

type Settings = {
    title?: string;
    titleFontOptions?: FontOptions;
    barColor: string;
    trackColor: string;
    minValue: number;
    maxValue: number;
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
            name: "titleFontOptions",
            title: "Title Font Options",
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
            default: "#000000",
            validation: {
                required: true,
                pattern: "^#[0-9A-Fa-f]{6}$"
            }
        },
        {
            name: "barColor",
            title: "Bar Color",
            type: "hexcolor",
            default: "#00FF00",
            validation: {
                required: true,
                pattern: "^#[0-9A-Fa-f]{6}$"
            }
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
            }
        }
    ],
    initialAspectRatio: { width: 16, height: 2 },
    initialState: {
        currentValue: 0
    },
    supportsLivePreview: true,
    livePreviewState: {
        currentValue: 50
    },
    overlayExtension: {
        eventHandler: (event: WidgetOverlayEvent<Settings, State>, utils: IOverlayWidgetUtils) => {
            const generateWidgetHtml = (config: typeof event["data"]["widgetConfig"]) => {
                const currentValue = (config.state?.currentValue as number) ?? 0;
                const minValue = (config.settings?.minValue as number) ?? 0;
                const maxValue = (config.settings?.maxValue as number) ?? 100;

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

                const trackStyles = {
                    width: "100%",
                    height: "100%",
                    "background-color": config.settings?.trackColor || "#000000",
                    border: "1px solid #ccc",
                    "border-radius": "100vh",
                    overflow: "hidden"
                };

                const progressBarStyles = {
                    width: `${currentPercentage}%`,
                    "background-color": config.settings?.barColor || "#00FF00",
                    height: "100%",
                    transition: "width 0.5s ease-in-out"
                };

                const titleStyles = {
                    "font-family": config.settings?.titleFontOptions?.family || 'Inter, sans-serif',
                    "font-size": (config.settings?.titleFontOptions?.size ? `${config.settings.titleFontOptions.size}px` : '48px'),
                    "font-weight": config.settings?.titleFontOptions?.weight?.toString() || '400',
                    "font-style": config.settings?.titleFontOptions?.italic ? 'italic' : 'normal',
                    "color": config.settings?.titleFontOptions?.color || '#FFFFFF',
                    "text-align": "center",
                    "margin-bottom": "8px"
                };

                return `
                <div id="progress-bar-container" style="${utils.stylesToString(containerStyles)}">
                    ${config.settings?.title ? `<div id="progress-bar-title" style="${utils.stylesToString(titleStyles)}">${config.settings?.title || ''}</div>` : ''}
                    <div id="progress-bar-track" style="${utils.stylesToString(trackStyles)}">
                        <div id="progress-bar" style="${utils.stylesToString(progressBarStyles)}"></div>
                    </div>
                </div>
                `;
            };

            utils.handleOverlayEvent(generateWidgetHtml);
        }
    }
};
