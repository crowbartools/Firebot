import { OverlayWidgetType, IOverlayWidgetEventUtils, WidgetOverlayEvent } from "../../../../types/overlay-widgets";
import { EventManager } from "../../../events/event-manager";

type Settings = {
    onEventJs: string;
};

type State = {};

export const customAdvanced: OverlayWidgetType<Settings, State> = {
    id: "firebot:custom-advanced",
    name: "Custom Widget (Advanced)",
    description: "Advanced custom widget that leaves everything up to you. Supply JavaScript to handle events in the overlay and modify the DOM as you see fit.",
    icon: "fa-cogs",
    settingsSchema: [
        {
            name: "onEventJs",
            type: "codemirror",
            title: "onEvent JS",
            description: "Code that runs when the widget receives any event. Ran in an async function (await is supported).",
            default:
`// Example: show & hide a red box
if (eventName === "show") {
  const styles = {
    width: "100px",
    height: "100px",
    position: "absolute",
    top: "100px",
    left: "100px",
    background: "red",
  };
  overlayWrapperElement
    .insertAdjacentHTML(
  		"beforeend",
  		\`<div id="\${widgetId}" style="\${utils.stylesToString(styles)}"></div>\`);
} else if (eventName === "remove") {
  document
    .getElementById(widgetId)?.remove();
}`,
            tip:
`The following variables are available:
- \`eventName\` (the name of the received event: \`show\`, \`settings-update\`, \`state-update\`, \`message\`, \`remove\`)
- \`widgetId\` (this widget's unique ID)
- \`widgetState\` (the current state of the widget, if any)
- \`messageName\` (the name of the received message, if event is 'message')
- \`messageData\` (the data sent with the message, if any and if event is 'message')
- \`overlayWrapperElement\` (the official root element of the overlay, it's recommended to use this for DOM manipulations)
- \`utils.stylesToString(styles)\` (utility function to convert a styles object to an inline css string)
- \`utils.sendMessageToFirebot(messageName: string, messageData?: any)\` (utility function to send a message back to Firebot)`,
            settings: {
                mode: { name: "javascript" },
                lineNumbers: true,
                showGutter: true,
                autoRefresh: true,
                theme: "blackboard"
            },
            validation: {
                required: true
            }
        }
    ],
    initialState: {},
    userCanConfigure: {
        position: false,
        entryAnimation: false,
        exitAnimation: false
    },
    supportsLivePreview: false,
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
            if (!event.data.widgetConfig.settings.onEventJs) {
                return;
            }

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
                    console.error(`Error in custom widget "${(event.data.widgetConfig as any).name ?? event.data.widgetConfig.id}":`);
                    console.error(e);
                }
            };

            await runRawJs(event.data.widgetConfig.settings.onEventJs, {
                eventName: event.name,
                widgetId: event.data.widgetConfig.id,
                widgetState: event.data.widgetConfig.state,
                messageName: event.data.messageName,
                messageData: event.data.messageData,
                overlayWrapperElement: document.body.querySelector(".wrapper"),
                utils: {
                    ...utils,
                    sendMessageToFirebot: utils.sendMessageToFirebot.bind(utils)
                }
            });
        }
    }
};
