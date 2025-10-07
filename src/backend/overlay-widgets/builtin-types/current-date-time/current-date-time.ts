import { OverlayWidgetType, IOverlayWidgetEventUtils, WidgetOverlayEvent } from "../../../../types/overlay-widgets";
import { FontOptions } from "../../../../types/parameters";

type Settings = {
    format?: string;
    fontOptions?: FontOptions;
    horizontalAlignment: "left" | "center" | "right";
    verticalAlignment: "top" | "center" | "bottom";
};

type State = {};

export const currentDateTime: OverlayWidgetType<Settings, State> = {
    id: "firebot:current-date-time",
    name: "Current Date / Time",
    description: "A widget that displays the current date and/or time.",
    icon: "fa-clock",
    settingsSchema: [
        {
            name: "format",
            title: "Format",
            description: 'Uses [luxon.js](https://moment.github.io/luxon/#/formatting?id=table-of-tokens) formatting rules.',
            type: "string",
            default: "DD h:mm:ss a",
            useTextArea: true,
            validation: {
                required: true
            }
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
            allowAlpha: true,
            showBottomHr: true
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
            default: "center",
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
            default: "center",
            showBottomHr: true
        }
    ],
    initialAspectRatio: { width: 3, height: 2 },
    initialState: {},
    supportsLivePreview: true,
    livePreviewState: {},
    overlayExtension: {
        dependencies: {
            js: [
                "https://cdn.jsdelivr.net/npm/luxon@3.7.2/build/global/luxon.min.js"
            ]
        },
        eventHandler: (event: WidgetOverlayEvent<Settings, State>, utils: IOverlayWidgetEventUtils) => {
            const generateWidgetHtml = (config: typeof event["data"]["widgetConfig"]) => {
                const containerStyles = {
                    "width": "100%",
                    "height": "100%",
                    "display": "flex",
                    "flex-direction": "column",
                    "justify-content": config.settings?.verticalAlignment === 'top' ? 'flex-start' : config.settings?.verticalAlignment === 'bottom' ? 'flex-end' : 'center',
                    "align-items": config.settings?.horizontalAlignment === 'left' ? 'flex-start' : config.settings?.horizontalAlignment === 'right' ? 'flex-end' : 'center',
                    "text-align": config.settings?.horizontalAlignment as string,
                    ...utils.getFontOptionsStyles(config.settings?.fontOptions),
                };

                const DateTime = (window as any).luxon.DateTime;

                const now = DateTime.now();
                const formatted = config.settings?.format ? now.toFormat(config.settings.format) : now.toLocaleString(DateTime.DATETIME_MED);

                return `
                <div id="text-container" style="${utils.stylesToString(containerStyles)}">
                    ${formatted?.replace(/\n/g, '<br>') ?? ''}
                </div>
                `;
            };

            utils.handleOverlayEvent(generateWidgetHtml);


            if(event.name === "show") {
                utils.getWidgetContainerElement()?.addEventListener("firebot:clock-tick", (e) => {
                    if(e.target?.["widgetConfig"]) {
                        utils.updateWidgetContent(generateWidgetHtml(e.target["widgetConfig"]));
                    }
                });
            }
        },
        onInitialLoad: (utils) => {
            const timeUntilNextSecond = 1000 - (Date.now() % 1000);
            setTimeout(() => {
                setInterval(() => {
                    utils.getWidgetContainerElements().forEach(widgetEl => {
                        widgetEl.dispatchEvent(new CustomEvent("firebot:clock-tick"));
                    });
                }, 1000);
            }, timeUntilNextSecond);
        }
    }
};
