import type { OverlayWidgetType, IOverlayWidgetEventUtils, WidgetOverlayEvent } from "../../../../types/overlay-widgets";
import type { Settings, State } from "./counter-display-types";
import { CounterManager } from "../../../counters/counter-manager";

const getStateForCounter = (counterId?: string): State => {
    if (counterId) {
        const counter = CounterManager.getItem(counterId);
        if (counter) {
            return {
                counterName: counter.name,
                counterValue: counter.value
            };
        }
    }

    return {
        counterName: undefined,
        counterValue: undefined
    };
};

export const counterDisplay: OverlayWidgetType<Settings, State> = {
    id: "firebot:counter-display",
    name: "Counter Display",
    description: "A display for a given Counter",
    icon: "fa-hashtag",
    settingsSchema: [
        {
            name: "counterId",
            title: "Counter",
            description: "The counter to display the value of. Make sure to set up a counter in the Counters tab if you haven't already.",
            type: "counter-select",
            validation: {
                required: true
            }
        },
        {
            name: "counterFontOptions",
            title: "Counter Font Options",
            description: "Font options for the counter number value.",
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
            name: "showCounterName",
            title: "Show Counter Name",
            description: "Whether to show the name of the counter above the value.",
            type: "boolean",
            default: true
        },
        {
            name: "nameFontOptions",
            title: "Counter Name Font Options",
            description: "Font options for the counter name, if shown.",
            type: "font-options",
            default: {
                family: "Inter",
                weight: 400,
                size: 18,
                italic: false,
                color: "#FFFFFF"
            },
            allowAlpha: true,
            showBottomHr: true
        },
        {
            name: "textAlignment",
            title: "Text Alignment",
            description: "Alignment of the counter text within the widget area.",
            type: "radio-cards",
            options: [
                { value: "left", label: "Left", iconClass: "fa-align-left" },
                { value: "center", label: "Center", iconClass: "fa-align-center" },
                { value: "right", label: "Right", iconClass: "fa-align-right" }
            ],
            settings: {
                gridColumns: 3
            },
            default: "center"
        }
    ],
    initialAspectRatio: { width: 1, height: 1 }, // square
    initialState: {
        counterName: undefined,
        counterValue: undefined
    },
    supportsLivePreview: true,
    livePreviewState: {
        counterName: "Example Counter",
        counterValue: 50
    },
    onShow(event) {
        if (event.previewMode) {
            return {};
        }
        return {
            newState: getStateForCounter(event.settings?.counterId),
            persistState: false
        };
    },
    onSettingsUpdate(event) {
        if (event.previewMode) {
            return {};
        }
        return {
            newState: getStateForCounter(event.settings?.counterId),
            persistState: false
        };
    },
    overlayExtension: {
        eventHandler: (event: WidgetOverlayEvent<Settings, State>, utils: IOverlayWidgetEventUtils) => {
            const generateWidgetHtml = (config: typeof event["data"]["widgetConfig"]) => {
                const counterName = config.state?.counterName ?? "Counter";
                const counterValue = config.state?.counterValue ?? "-";

                const containerStyles = {
                    "width": "100%",
                    "height": "100%",
                    "display": "flex",
                    "flex-direction": "column",
                    "justify-content": "center",
                    "align-items": config.settings?.textAlignment === 'left' ? 'flex-start' : config.settings?.textAlignment === 'right' ? 'flex-end' : 'center'
                };

                const nameStyles = {
                    ...utils.getFontOptionsStyles(config.settings?.nameFontOptions),
                    "margin-bottom": "8px"
                };

                const valueStyles = utils.getFontOptionsStyles(config.settings?.counterFontOptions);

                return `
                <div id="counter-container" style="${utils.stylesToString(containerStyles)}">
                    ${config.settings?.showCounterName ? `<div id="counter-name" style="${utils.stylesToString(nameStyles)}">${counterName}</div>` : ''}
                    <div id="${config.id}-counter-value" style="${utils.stylesToString(valueStyles)}">${counterValue}</div>
                </div>
                `;
            };

            (window as any).countUpMap = (window as any).countUpMap ?? {};

            const widgetId = event.data.widgetConfig.id;
            const counterValue = event.data.widgetConfig.state?.counterValue ?? 0;

            switch (event.name) {
                case "show": {
                    utils.initializeWidget(
                        generateWidgetHtml(event.data.widgetConfig)
                    );

                    //@ts-ignore
                    const countUpForWidget = new countUp.CountUp(`${widgetId}-counter-value`, counterValue, {
                        startVal: counterValue,
                        duration: 1
                    });

                    countUpForWidget.start();

                    (window as any).countUpMap[widgetId] = countUpForWidget;
                    break;
                }
                case "settings-update": {
                    utils.updateWidgetContent(generateWidgetHtml(event.data.widgetConfig));

                    const countUpForWidget = (window as any).countUpMap[widgetId];
                    if (countUpForWidget) {
                        countUpForWidget.el = document.getElementById(`${widgetId}-counter-value`);
                        countUpForWidget.update(counterValue);
                    }

                    utils.updateWidgetPosition();
                    break;
                }
                case "state-update": {
                    const countUpForWidget = (window as any).countUpMap[widgetId];
                    if (countUpForWidget) {
                        countUpForWidget.el = document.getElementById(`${widgetId}-counter-value`);
                        countUpForWidget.update(counterValue);
                    } else {
                        utils.updateWidgetContent(generateWidgetHtml(event.data.widgetConfig));
                    }
                    break;
                }
                case "remove": {
                    utils.removeWidget();
                    if ((window as any).countUpMap[widgetId]) {
                        delete (window as any).countUpMap[widgetId];
                    }
                    break;
                }
                default:
                    console.warn(`Unhandled event type: ${event.name}`);
                    break;
            }

            // utils.handleOverlayEvent(generateWidgetHtml);
        }
    }
};
