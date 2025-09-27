import { FontOptions } from "../../../../types/parameters";
import { OverlayWidgetType, OverlayWidgetConfig } from "../../../../types/overlay-widgets";
import { WidgetOverlayEvent } from "../../../../types/overlay-widgets";
import { Duration } from "luxon";

export type Settings = {
    fontOptions: FontOptions;
    alignment: "left" | "center" | "right";
    runWhenInactive?: boolean;
}

export type State = {
    remainingSeconds: number;
    mode: "running" | "paused";
}

export type DynamicCountdownWidgetConfig = OverlayWidgetConfig<Settings, State> & {
    type: "firebot:countdown-dynamic";
}

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
        }
    ],
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
    overlayExtension: {
        eventHandler: (event: WidgetOverlayEvent<Settings, State>) => {
            const generateWidgetHtml = (config: typeof event["data"]["widgetConfig"]) => {
                const remainingSeconds = config.state?.remainingSeconds as number ?? 0;

                // show time as hh:mm:ss
                const hours = Math.floor(remainingSeconds / 3600);
                const minutes = Math.floor((remainingSeconds % 3600) / 60);
                const seconds = remainingSeconds % 60;
                const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                const containerStyles = {
                    "font-family": config.settings?.fontOptions?.family || 'Inter, sans-serif',
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
                <div id="countdown-container" style="${Object.entries(containerStyles).map(([key, value]) => `${key}: ${value};`).join(' ')}">
                    <div id="time-remaining">
                        ${timeString}
                    </div>
                </div>`;
            };

            switch (event.name) {
                case "show": {
                    initializeWidget(
                        event.data.widgetConfig.id,
                        event.data.widgetConfig.position,
                        event.data.widgetConfig.entryAnimation,
                        generateWidgetHtml(event.data.widgetConfig),
                        event.data.previewMode
                    );
                    break;
                }
                case "settings-update": {
                    updateWidgetContent(event.data.widgetConfig.id, generateWidgetHtml(event.data.widgetConfig));
                    updateWidgetPosition(event.data.widgetConfig.id, event.data.widgetConfig.position);
                    break;
                }
                case "state-update": {
                    updateWidgetContent(event.data.widgetConfig.id, generateWidgetHtml(event.data.widgetConfig));
                    break;
                }
                case "remove": {
                    removeWidget(event.data.widgetConfig.id, event.data.widgetConfig.exitAnimation);
                    break;
                }
                default:
                    console.warn(`Unhandled event type: ${event.name}`);
                    break;
            }
        }
    }
};
