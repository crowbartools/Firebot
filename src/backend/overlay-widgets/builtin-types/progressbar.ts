import { OverlayWidgetType } from "../../../types/overlay-widgets";

type Settings = {
    barColor: string;
    backgroundColor: string;
    minValue: number;
    maxValue: number;
}

type State = {
    currentValue: number;
}

export const progressbar: OverlayWidgetType<Settings, State> = {
    id: "firebot:progressbar",
    name: "Progress Bar",
    description: "A simple progress bar that can be updated via commands or variables.",
    icon: "fa-percentage",
    settingsSchema: [
        {
            name: "backgroundColor",
            title: "Background Color",
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
    initialState: {
        currentValue: 0
    },
    supportsLivePreview: true,
    livePreviewState: {
        currentValue: 50
    },
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        eventHandler: (event: WidgetOverlayEvent) => {
            console.log(`Progress Bar widget received event: ${event.name}`, event);

            const generateWidgetHtml = (config: WidgetOverlayEvent["data"]["widgetConfig"]) => {
                const currentValue = config.state?.currentValue as number ?? 0;
                const minValue = config.settings?.minValue as number ?? 0;
                const maxValue = config.settings?.maxValue as number ?? 100;

                // Calculate percentage, ensuring it's between 0 and 100
                const currentPercentage = Math.min(100, Math.max(0, (
                    currentValue - minValue) / (maxValue - minValue) * 100));

                return `
                <div id="progress-bar-container" style="width: 100%; height: 100%; background-color: ${config.settings?.backgroundColor || '#000000'}; border: 1px solid #ccc; border-radius: 100vh; overflow: hidden;">
                    <div id="progress-bar" style="width: ${currentPercentage}%; background-color: ${config.settings?.barColor || '#00FF00'}; height: 100%;"></div>
                </div>`;
            };

            switch (event.name) {
                case "show": {
                    initializeWidget(
                        event.data.widgetConfig.id,
                        event.data.widgetConfig.position,
                        event.data.widgetConfig.entryAnimation,
                        generateWidgetHtml(event.data.widgetConfig)
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
