import { TypedEmitter } from "tiny-typed-emitter";

type Events = {
    "overlay-widget-type-registered": (overlayWidgetType: unknown) => void
};

class OverlayWidgetsManager extends TypedEmitter<Events> {

    private overlayWidgetTypes: Map<string, unknown> = new Map();

    constructor() {
        super();
    }
}