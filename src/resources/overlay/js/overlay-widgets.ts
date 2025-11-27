type WidgetOverlayEvent = import("../../../types/overlay-widgets").WidgetOverlayEvent;
type Position = import("../../../types/overlay-widgets").Position;
type OverlayAnimation = import("../../../types/overlay-widgets").Animation;
type IOverlayWidgetEventUtils = import("../../../types/overlay-widgets").IOverlayWidgetEventUtils;
type IOverlayWidgetInitUtils = import("../../../types/overlay-widgets").IOverlayWidgetInitUtils;
type FontOptions = import("../../../types/parameters").FontOptions;

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

    getWidgetPositionStyle(position?: Position, zIndex?: number): string {
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
    ) {
        const container = this.getWidgetContainerElement();
        if (container) {
            container.remove();
        }

        let positionStyle = this.getWidgetPositionStyle();

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
}

function handleOverlayEvent(event: WidgetOverlayEvent) {
    // @ts-ignore
    widgetEvents.emit(`overlay-widget:${event.data.widgetType.id}`, event, new OverlayWidgetEventUtils(event));
}