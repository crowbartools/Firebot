import { OverlayWidgetType, IOverlayWidgetEventUtils, WidgetOverlayEvent } from "../../../../types/overlay-widgets";

type Settings = {
    imageType: "local" | "url";
    filepath: string;
    url: string;
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
            name: "imageType",
            title: "Image Type",
            description: "Choose between a local file or an external URL.",
            type: "radio-cards",
            options: [{
                value: "local", label: "Local File", iconClass: "fa-folder-open"
            }, {
                value: "url", label: "URL", iconClass: "fa-link"
            }],
            settings: {
                gridColumns: 2
            },
            validation: {
                required: true
            },
            default: "local"
        },
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
            },
            showIf: {
                imageType: "local"
            }
        },
        {
            name: "url",
            title: "Image URL",
            type: "string",
            default: "",
            validation: {
                required: true
            },
            showIf: {
                imageType: "url"
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

                let imageSrc = "";
                if (config.settings?.imageType === "url" && config.settings?.url) {
                    imageSrc = config.settings.url;
                } else if (config.settings?.imageType === "local" && config.resourceTokens.filepath) {
                    imageSrc = `http://${window.location.hostname}:7472/resource/${config.resourceTokens.filepath}`;
                }

                return `
                <div id="image-container" style="${utils.stylesToString(containerStyles)}">
                    ${imageSrc ? `<img src="${imageSrc}" style="${utils.stylesToString(imageStyles)}" />` : ''}
                </div>
                `;
            };

            utils.handleOverlayEvent(generateWidgetHtml);
        }
    }
};
