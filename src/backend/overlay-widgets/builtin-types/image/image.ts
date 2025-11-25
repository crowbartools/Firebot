import { OverlayWidgetType, IOverlayWidgetEventUtils, WidgetOverlayEvent } from "../../../../types/overlay-widgets";

type Settings = {
    filepath: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type State = {};

export const image: OverlayWidgetType<Settings, State> = {
    id: "firebot:image",
    name: "Image",
    description: "A simple image widget that displays a static image in the overlay.",
    icon: "fa-image",
    settingsSchema: [
        {
            name: "filepath",
            title: "Image File",
            type: "filepath",
            default: "",
            fileOptions: {
                title: "Select an Image File",
                buttonLabel: "Select Image",
                directoryOnly: false,
                filters: [
                    { name: 'Image', extensions: ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'apng', 'svg', 'webp'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            },
            validation: {
                required: true
            }
        }
    ],
    initialAspectRatio: { width: 3, height: 2 },
    initialState: {},
    supportsLivePreview: true,
    livePreviewState: {},
    resourceKeys: ["filepath"],
    overlayExtension: {
        eventHandler: (event: WidgetOverlayEvent<Settings, State>, utils: IOverlayWidgetEventUtils) => {
            const generateWidgetHtml = (config: typeof event["data"]["widgetConfig"]) => {
                const containerStyles = {
                    "width": "100%",
                    "height": "100%",
                    "display": "flex",
                    "justify-content": "center",
                    "align-items": "center"
                };

                const imageStyles = {
                    "max-width": "100%",
                    "max-height": "100%",
                    "object-fit": "contain"
                };

                return `
                <div id="image-container" style="${utils.stylesToString(containerStyles)}">
                    ${config.resourceTokens.filepath ? `<img src="http://${window.location.hostname}:7472/resource/${config.resourceTokens.filepath}" style="${utils.stylesToString(imageStyles)}" />` : ''}
                </div>
                `;
            };

            utils.handleOverlayEvent(generateWidgetHtml);
        }
    }
};
