type WidgetOverlayEvent = import("../../../types").WidgetOverlayEvent;
type Position = import("../../../types").Position;
type OverlayAnimation = import("../../../types").Animation;
type IOverlayWidgetEventUtils = import("../../../types").IOverlayWidgetEventUtils;
type IOverlayWidgetInitUtils = import("../../../types").IOverlayWidgetInitUtils;
type FontOptions = import("../../../types").FontOptions;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OverlayWidgetComponent = import("../../../types").OverlayWidgetComponent<any, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OverlayWidgetInstance = import("../../../types").OverlayWidgetInstance<any, any>;

// @ts-ignore
widgetEvents = new EventEmitter();

class OverlayWidgetInitUtils implements IOverlayWidgetInitUtils {
    constructor(protected readonly typeId: string) {
    }
    getWidgetContainerElements(): NodeListOf<HTMLElement> {
        return document.querySelectorAll<HTMLElement>(`[data-widget-type="${this.typeId}"]`);
    }
}

(window as any).OverlayWidgetInitUtils = OverlayWidgetInitUtils;

class OverlayWidgetEventUtils implements IOverlayWidgetEventUtils {

    constructor(private readonly widgetEvent: WidgetOverlayEvent) {
    }

    private get widgetId() {
        return this.widgetEvent.data.widgetConfig.id;
    }

    handleOverlayEvent(
        generateWidgetHtml: (widgetConfig: WidgetOverlayEvent["data"]["widgetConfig"]) => string,
        updateOnMessage = false
    ): void {
        switch (this.widgetEvent.name) {
            case "show": {
                const createdWidget = this.initializeWidget(
                    generateWidgetHtml(this.widgetEvent.data.widgetConfig)
                );
                if (createdWidget) {
                    createdWidget["widgetConfig"] = this.widgetEvent.data.widgetConfig;
                }
                break;
            }
            case "settings-update": {
                const updatedWidget = this.updateWidgetContent(generateWidgetHtml(this.widgetEvent.data.widgetConfig));
                if (updatedWidget) {
                    updatedWidget["widgetConfig"] = this.widgetEvent.data.widgetConfig;
                }
                this.updateWidgetPosition();
                break;
            }
            case "state-update": {
                const updatedWidget = this.updateWidgetContent(generateWidgetHtml(this.widgetEvent.data.widgetConfig));
                if (updatedWidget) {
                    updatedWidget["widgetConfig"] = this.widgetEvent.data.widgetConfig;
                }
                break;
            }
            case "remove": {
                this.removeWidget();
                break;
            }
            case "message": {
                if (updateOnMessage) {
                    const updatedWidget = this.updateWidgetContent(generateWidgetHtml(this.widgetEvent.data.widgetConfig));
                    if (updatedWidget) {
                        updatedWidget["widgetConfig"] = this.widgetEvent.data.widgetConfig;
                    }
                }
                break;
            }
            default:
                console.warn(`Unhandled event type: ${this.widgetEvent.name}`);
                break;
        }
    }

    getWidgetPositionStyle(position?: Position, zIndex?: number, additionalStyles?: Record<string, string | number | undefined>): string {
        if (!position) {
            position = this.widgetEvent.data.widgetConfig.position;
        }

        if (zIndex == null) {
            zIndex = this.widgetEvent.data.widgetConfig.zIndex;
        }

        const styles = {
            position: "fixed",
            top: position.y !== null ? `${position.y}px` : undefined,
            left: position.x !== null ? `${position.x}px` : undefined,
            width: position.width !== null ? `${position.width}px` : undefined,
            height: position.height !== null ? `${position.height}px` : undefined,
            'z-index': zIndex != null ? zIndex : undefined,
            ...additionalStyles,
        };

        return Object.entries(styles).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc += `${key}: ${value};`;
            }
            return acc;
        }, "");
    }

    getWidgetContainerElement() {
        return document.querySelector<HTMLElement>(`[data-widget-id="${this.widgetId}"]`);
    }

    initializeWidget(
        html: string,
        additionalContainerStyles?: Record<string, string | number | undefined>
    ) {
        const container = this.getWidgetContainerElement();
        if (container) {
            container.remove();
        }

        let positionStyle = this.getWidgetPositionStyle(undefined, undefined, additionalContainerStyles);

        if (this.widgetEvent.data.previewMode) {
            // add a border to the widget in preview mode
            positionStyle += "border: 1px dashed #FF0000;";
        }

        const id = this.widgetId;
        const entryAnimation = this.widgetEvent.data.widgetConfig.entryAnimation;

        const wrappedHtml = `
            <div id="${id}-container" data-widget-id="${id}" data-widget-type="${this.widgetEvent.data.widgetType.id}" style="${positionStyle}">${html}</div>
        `;

        const overlayWrapper = document.body.querySelector(".wrapper");
        if (overlayWrapper) {
            overlayWrapper.insertAdjacentHTML("beforeend", wrappedHtml);

            if (entryAnimation?.class != null && entryAnimation?.class !== "" && entryAnimation?.class !== "none") {
                const duration = entryAnimation.duration ? `${entryAnimation.duration}s` : undefined;
                //@ts-ignore
                $(`[data-widget-id="${this.widgetId}"]`).animateCss(entryAnimation.class, duration);
            }
        }

        return this.getWidgetContainerElement();
    }

    updateWidgetContent(html: string) {
        const widgetElement = this.getWidgetContainerElement();
        if (!widgetElement) {
            console.warn(`Widget element with ID '${this.widgetId}' not found for content update.`);
            return null;
        }

        widgetElement.innerHTML = html;
        return widgetElement;
    }

    updateWidgetPosition() {
        const widgetElement = this.getWidgetContainerElement();
        if (!widgetElement) {
            console.warn(`Widget element with ID '${this.widgetId}' not found for position update.`);
            return null;
        }

        const position = this.widgetEvent.data.widgetConfig.position;

        if (!position) {
            console.warn(`No position data available for widget ID '${this.widgetId}'.`);
            return widgetElement;
        }

        const animateConfig = {
            top: position.y,
            left: position.x,
            width: position.width,
            height: position.height
        };

        const zIndex = this.widgetEvent.data.widgetConfig.zIndex;
        animateConfig['z-index'] = zIndex ?? 0;

        //@ts-ignore
        (Motion as any).animate(widgetElement, animateConfig);

        return widgetElement;
    }

    removeWidget() {
        const widgetElement = this.getWidgetContainerElement();
        if (!widgetElement) {
            return;
        }

        const exitAnimation = this.widgetEvent.data.widgetConfig.exitAnimation;

        if (exitAnimation?.class != null && exitAnimation?.class !== "" && exitAnimation?.class !== "none") {
            const duration = exitAnimation.duration ? `${exitAnimation.duration}s` : undefined;
            //@ts-ignore
            $(widgetElement).animateCss(exitAnimation.class, duration, null, null, () => {
                const updatedElement = this.getWidgetContainerElement();
                updatedElement?.remove();
            });
        } else {
            widgetElement.remove();
        }
    }

    stylesToString(styles: Record<string, string | number | undefined>): string {
        return Object.entries(styles)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => `${key}: ${value};`)
            .join('')
    }

    getFontOptionsStyles(fontOptions?: FontOptions): Record<string, string | number | undefined> {
        return {
            "font-family": (fontOptions?.family ? `'${fontOptions.family}'` : 'Inter, sans-serif'),
            "font-size": (fontOptions?.size ? `${fontOptions.size}px` : undefined),
            "font-weight": fontOptions?.weight?.toString() || undefined,
            "font-style": fontOptions?.italic ? 'italic' : 'normal',
            "color": fontOptions?.color || '#FFFFFF',
        };
    }
    sendMessageToFirebot(messageName: string, messageData?: unknown): void {
        sendWebsocketEvent("overlay-widget-message", {
            widgetConfigId: this.widgetId,
            messageName,
            messageData
        });
    }
    invokeFirebotRequest<TData extends Record<string, unknown> = Record<string, unknown>, TResponse = unknown>(requestName: string, requestData?: TData): Promise<TResponse> {
        return invokeWebsocketRequest(requestName, {
            widgetConfigId: this.widgetId,
            ...requestData
        });
    }
}

const componentModuleCache = new Map<string, Promise<{ default: OverlayWidgetComponent }>>();
const componentInstances = new Map<string, OverlayWidgetInstance>();

// This file is compiled to CommonJS via tsc which turns a literal `import()` into a
// `require()` call, which fails in the browser. Wrapping the the dynamic import in a Function
// is a hack to keep it a genuine ESM import that isn't touched by tsc
const nativeImport = new Function("specifier", "return import(specifier);") as (
    specifier: string
) => Promise<{ default: OverlayWidgetComponent }>;

function loadComponentModule(typeId: string, bundleUrl: string) {
    if (!componentModuleCache.has(typeId)) {
        componentModuleCache.set(typeId, nativeImport(bundleUrl));
    }
    return componentModuleCache.get(typeId);
}

async function handleComponentEvent(event: WidgetOverlayEvent, utils: IOverlayWidgetEventUtils) {
    const typeId = event.data.widgetType.id;
    const widgetId = event.data.widgetConfig.id;

    try {
        switch (event.name) {
            case "show": {
                componentInstances.get(widgetId)?.destroy();
                componentInstances.delete(widgetId);

                const module = await loadComponentModule(typeId, `/overlay/widget-components/${encodeURIComponent(typeId)}`);
                const component = module?.default;
                if (!component) {
                    console.error(`Component widget bundle for '${typeId}' has no default export.`);
                    return;
                }

                const container = utils.initializeWidget("");
                if (!container) {
                    return;
                }

                const instance = await component.mount({
                    container,
                    config: event.data.widgetConfig,
                    utils
                });
                componentInstances.set(widgetId, instance);
                break;
            }
            case "settings-update": {
                utils.updateWidgetPosition();
                componentInstances.get(widgetId)?.update(event.data.widgetConfig);
                break;
            }
            case "state-update": {
                componentInstances.get(widgetId)?.update(event.data.widgetConfig);
                break;
            }
            case "message": {
                componentInstances.get(widgetId)?.onMessage?.(event.data.messageName, event.data.messageData);
                break;
            }
            case "remove": {
                componentInstances.get(widgetId)?.destroy();
                componentInstances.delete(widgetId);
                utils.removeWidget();
                break;
            }
            default:
                console.warn(`Unhandled component widget event type: ${event.name}`);
                break;
        }
    } catch (ex) {
        console.error(`Error handling '${event.name}' for component widget '${typeId}' (${widgetId})`, ex);
    }
}

function handleOverlayEvent(event: WidgetOverlayEvent) {
    const utils = new OverlayWidgetEventUtils(event);

    if (event.data.isComponentWidget) {
        void handleComponentEvent(event, utils);
        return;
    }

    // @ts-ignore
    widgetEvents.emit(`overlay-widget:${event.data.widgetType.id}`, event, utils);
}