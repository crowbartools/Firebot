type WidgetOverlayEvent = import("../../../types/overlay-widgets").WidgetOverlayEvent;
type Position = import("../../../types/overlay-widgets").Position;
type OverlayAnimation = import("../../../types/overlay-widgets").Animation;
type IOverlayWidgetUtils = import("../../../types/overlay-widgets").IOverlayWidgetUtils;

// @ts-ignore
widgetEvents = new EventEmitter();

class OverlayWidgetUtils implements IOverlayWidgetUtils {

    constructor(private readonly widgetEvent: WidgetOverlayEvent) {
    }

    private get widgetId() {
        return this.widgetEvent.data.widgetConfig.id;
    }

    handleOverlayEvent(
        generateWidgetHtml: (widgetConfig: WidgetOverlayEvent["data"]["widgetConfig"]) => string
    ): void {
        switch (this.widgetEvent.name) {
            case "show": {
                this.initializeWidget(
                    generateWidgetHtml(this.widgetEvent.data.widgetConfig)
                );
                break;
            }
            case "settings-update": {
                this.updateWidgetContent(generateWidgetHtml(this.widgetEvent.data.widgetConfig));
                this.updateWidgetPosition();
                break;
            }
            case "state-update": {
                this.updateWidgetContent(generateWidgetHtml(this.widgetEvent.data.widgetConfig));
                break;
            }
            case "remove": {
                this.removeWidget();
                break;
            }
            default:
                console.warn(`Unhandled event type: ${this.widgetEvent.name}`);
                break;
        }
    }

    getWidgetPositionStyle(position?: Position) {
        if (!position) {
            position = this.widgetEvent.data.widgetConfig.position;
        }

        const styles = {
            position: "fixed",
            top: position.y !== null ? `${position.y}px` : undefined,
            left: position.x !== null ? `${position.x}px` : undefined,
            width: position.width !== null ? `${position.width}px` : undefined,
            height: position.height !== null ? `${position.height}px` : undefined
        };

        return Object.entries(styles).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc += `${key}: ${value};`;
            }
            return acc;
        }, "");
    }

    getWidgetElement() {
        return document.getElementById(`${this.widgetId}-container`);
    }

    initializeWidget(
        html: string,
    ) {
        const container = this.getWidgetElement();
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
            <div id="${id}-container" style="${positionStyle}">${html}</div>
        `;

        const overlayWrapper = document.body.querySelector(".wrapper");
        if (overlayWrapper) {
            overlayWrapper.insertAdjacentHTML("beforeend", wrappedHtml);

            if (entryAnimation?.class != null && entryAnimation?.class !== "" && entryAnimation?.class !== "none") {
                const duration = entryAnimation.duration ? `${entryAnimation.duration}s` : undefined;
                //@ts-ignore
                $(`#${id}-container`).animateCss(entryAnimation.class, duration);
            }
        }

        return this.getWidgetElement();
    }

    updateWidgetContent(html: string) {
        const widgetElement = this.getWidgetElement();
        if (!widgetElement) {
            console.warn(`Widget element with ID '${this.widgetId}' not found for content update.`);
            return null;
        }

        widgetElement.innerHTML = html;
        return widgetElement;
    }

    updateWidgetPosition() {
        const widgetElement = this.getWidgetElement();
        if (!widgetElement) {
            console.warn(`Widget element with ID '${this.widgetId}' not found for position update.`);
            return null;
        }

        const position = this.widgetEvent.data.widgetConfig.position;

        if (!position) {
            console.warn(`No position data available for widget ID '${this.widgetId}'.`);
            return widgetElement;
        }

        //@ts-ignore
        (Motion as any).animate(widgetElement, {
            top: position.y,
            left: position.x,
            width: position.width,
            height: position.height
        });

        return widgetElement;
    }

    removeWidget() {
        const widgetElement = this.getWidgetElement();
        if (!widgetElement) {
            return;
        }

        const exitAnimation = this.widgetEvent.data.widgetConfig.exitAnimation;

        if (exitAnimation?.class != null && exitAnimation?.class !== "" && exitAnimation?.class !== "none") {
            const duration = exitAnimation.duration ? `${exitAnimation.duration}s` : undefined;
            //@ts-ignore
            $(widgetElement).animateCss(exitAnimation.class, duration, null, null, () => {
                const updatedElement = this.getWidgetElement();
                updatedElement?.remove();
            });
        } else {
            widgetElement.remove();
        }
    }

    stylesToString(styles: Record<string, string | number | undefined>): string {
        return Object.entries(styles)
            .map(([key, value]) => `${key}: ${value};`)
            .join('')
    }
}

function handleOverlayEvent(event: WidgetOverlayEvent) {
    console.log(`Handling overlay event: ${event.name}`, event);

    // @ts-ignore
    widgetEvents.emit(`overlay-widget:${event.data.widgetType.id}`, event, new OverlayWidgetUtils(event));
}


