import { OverlayWidgetType, IOverlayWidgetEventUtils, WidgetOverlayEvent } from "../../../../types/overlay-widgets";
import { EventManager } from "../../../events/event-manager";

type Settings = {
    html: string;
    onShowJs?: string;
    onStateUpdateJs?: string;
    onMessageJs?: string;
};

type State = {};

export const custom: OverlayWidgetType<Settings, State> = {
    id: "firebot:custom",
    name: "Custom Widget",
    description: "Supply your own HTML and JavaScript to create a custom widget.",
    icon: "fa-cog",
    settingsSchema: [
        {
            name: "html",
            type: "codemirror",
            title: "HTML",
            description: "The initial HTML to display.",
            default: `<div id="my-widget">Hello, world!</div>`,
            settings: {
                mode: "htmlmixed",
                lineNumbers: true,
                showGutter: true,
                autoRefresh: true,
                theme: "blackboard"
            }
        },
        {
            name: "onShowJs",
            type: "codemirror",
            title: "onShow JS",
            description: "Optional code that runs when the widget is shown. Ran in an async function (await is supported).",
            default: `// Example: Change the text color of the widget's\n// content to red\ncontainerElement\n   .querySelector('#my-widget')\n   .style.color = 'red';`,
            tip:
`The following variables are available:
- \`containerElement\` (the root HTML element of the widget)
- \`widgetId\` (this widget's unique ID)
- \`widgetState\` (the current state of the widget, if any)
- \`utils.sendMessageToFirebot(messageName: string, messageData?: any)\` (utility function to send a message back to Firebot)`,
            settings: {
                mode: { name: "javascript" },
                lineNumbers: true,
                showGutter: true,
                autoRefresh: true,
                theme: "blackboard"
            }
        },
        {
            name: "onStateUpdateJs",
            type: "codemirror",
            title: "onStateUpdate JS",
            description: "Optional code that runs when the widget's state is updated via the Update Custom Widget State effect. Ran in an async function (await is supported).",
            default: ``,
            tip:
`The following variables are available:
- \`containerElement\` (the root HTML element of the widget)
- \`widgetId\` (this widget's unique ID)
- \`widgetState\` (the current state of the widget, if any)
- \`utils.sendMessageToFirebot(messageName: string, messageData?: any)\` (utility function to send a message back to Firebot)`,
            settings: {
                mode: { name: "javascript" },
                lineNumbers: true,
                showGutter: true,
                autoRefresh: true,
                theme: "blackboard"
            }
        },
        {
            name: "onMessageJs",
            type: "codemirror",
            title: "onMessage JS",
            description: "Optional code that runs when the widget receives a message from the Send Message To Custom Widget effect. Ran in an async function (await is supported).",
            default: ``,
            tip:
`The following variables are available:
- \`containerElement\` (the root HTML element of the widget)
- \`widgetId\` (this widget's unique ID)
- \`widgetState\` (the current state of the widget, if any)
- \`messageName\` (the name of the received message)
- \`messageData\` (the data sent with the message, if any)
- \`utils.sendMessageToFirebot(messageName: string, messageData?: any)\` (utility function to send a message back to Firebot)`,
            settings: {
                mode: { name: "javascript" },
                lineNumbers: true,
                showGutter: true,
                autoRefresh: true,
                theme: "blackboard"
            }
        }
    ],
    initialState: {},
    supportsLivePreview: true,
    livePreviewState: {},
    onOverlayMessage(config, messageName, messageData) {
        void EventManager.triggerEvent("firebot", "custom-widget-message-received", {
            customWidgetId: config.id,
            customWidgetName: config.name,
            customWidgetMessageName: messageName,
            customWidgetMessageData: messageData
        });
    },
    overlayExtension: {
        eventHandler: async (event: WidgetOverlayEvent<Settings, State>, utils: IOverlayWidgetEventUtils) => {
            utils.handleOverlayEvent((config) => {
                return config.settings.html as string ?? "<div></div>";
            });

            const runRawJs = async (jsCode: string, args: Record<string, unknown>) => {
                try {
                    const argsEntries = Object.entries(args);
                    const argsNames = argsEntries.map(([key]) => key);
                    const argsValues = argsEntries.map(([, value]) => value);

                    const AsyncFunction = (async function () {}).constructor;

                    // @ts-ignore
                    const evaluate = new AsyncFunction(
                        ...argsNames,
                        jsCode
                    );

                    // Attempt to call the evaluator function
                    await evaluate(
                        ...argsValues
                    );

                } catch (e) {
                    console.error(`Error in custom widget ${(event.data.widgetConfig as any).name ?? event.data.widgetConfig.id}:`, e);
                }
            };

            if ((event.name === "show" || event.name === "settings-update") && event.data.widgetConfig.settings.onShowJs) {
                await runRawJs(event.data.widgetConfig.settings.onShowJs, {
                    containerElement: utils.getWidgetContainerElement(),
                    widgetId: event.data.widgetConfig.id,
                    widgetState: event.data.widgetConfig.state,
                    utils: {
                        ...utils,
                        sendMessageToFirebot: utils.sendMessageToFirebot.bind(utils)
                    }
                });
            }

            if (event.name === "state-update" && event.data.widgetConfig.settings.onStateUpdateJs) {
                await runRawJs(event.data.widgetConfig.settings.onStateUpdateJs, {
                    containerElement: utils.getWidgetContainerElement(),
                    widgetId: event.data.widgetConfig.id,
                    widgetState: event.data.widgetConfig.state,
                    utils: {
                        ...utils,
                        sendMessageToFirebot: utils.sendMessageToFirebot.bind(utils)
                    }
                });
            }

            if (event.name === "message" && event.data.widgetConfig.settings.onMessageJs) {
                await runRawJs(event.data.widgetConfig.settings.onMessageJs, {
                    containerElement: utils.getWidgetContainerElement(),
                    widgetId: event.data.widgetConfig.id,
                    widgetState: event.data.widgetConfig.state,
                    messageName: event.data.messageName,
                    messageData: event.data.messageData,
                    utils: {
                        ...utils,
                        sendMessageToFirebot: utils.sendMessageToFirebot.bind(utils)
                    }
                });
            }
        }
    }
};
