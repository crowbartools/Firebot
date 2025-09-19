type WidgetOverlayEvent = import("../../../types/overlay-widgets").WidgetOverlayEvent;
type Position = import("../../../types/overlay-widgets").Position;

// @ts-ignore
widgetEvents = new EventEmitter();

function handleOverlayEvent(event: WidgetOverlayEvent) {
    console.log(`Handling overlay event: ${event.name}`, event);

    // @ts-ignore
    widgetEvents.emit(`overlay-widget:${event.data.widgetType.id}`, event);
}

function getWidgetPositionStyle(position: Position) {
    const styles = {
        position: "fixed",
        top: position.y !== null ? `${position.y}px` : undefined,
        left: position.x !== null ? `${position.x}px` : undefined,
        width: position.width !== null ? `${position.width}px` : undefined,
        height: position.height !== null ? `${position.height}px` : undefined,
    };

    return Object.entries(styles).reduce((acc, [key, value]) => {
        if(value !== undefined) {
            acc += `${key}: ${value};`;
        }
        return acc;
    }, "");
}

function getWidgetElement(id: string) {
    return document.getElementById(`${id}-container`);
}

function initializeWidget(id: string, position: Position, html: string) {
    const container = getWidgetElement(id);
    if(container) {
        container.remove();
    }

    const positionStyle = getWidgetPositionStyle(position);

    const wrappedHtml = `
        <div id="${id}-container" style="${positionStyle}">${html}</div>
    `;

    const overlayWrapper = document.body.querySelector('.wrapper');
    if(overlayWrapper) {
        overlayWrapper.insertAdjacentHTML('beforeend', wrappedHtml);
    }

    return getWidgetElement(id);
}

function updateWidgetPosition(id: string, position: Position) {
    const widgetElement = getWidgetElement(id);
    if(!widgetElement) {
        console.warn(`Widget element with ID '${id}' not found for position update.`);
        return null;
    }

    const positionStyle = getWidgetPositionStyle(position);
    widgetElement.setAttribute("style", positionStyle);

    return widgetElement;
}

function updateWidgetContent(id: string, html: string) {
    const widgetElement = getWidgetElement(id);
    if(!widgetElement) {
        console.warn(`Widget element with ID '${id}' not found for content update.`);
        return null;
    }

    widgetElement.innerHTML = html;
    return widgetElement;
}

function removeWidget(id: string) {
    const widgetElement = getWidgetElement(id);
    if(widgetElement) {
        widgetElement.remove();
    }
}