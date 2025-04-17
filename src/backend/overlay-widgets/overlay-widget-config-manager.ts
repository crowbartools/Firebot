import JsonDbManager from "../database/json-db-manager";

type OverlayWidgetConfig = {
    id?: string;
    name?: string;
}

class OverlayWidgetConfigManager extends JsonDbManager<OverlayWidgetConfig> {
    constructor() {
        super("Overlay Widgets", "/overlay-widgets");
    }
}

const manager = new OverlayWidgetConfigManager();

export = manager;