"use strict";

const SystemQuickAction = require("../quick-action");
const { WindowManager } = require("../../app-management/electron/window-manager");

class StreamPreviewQuickAction extends SystemQuickAction {
    constructor() {
        super({
            id: "firebot:stream-preview",
            name: "Open Stream Preview",
            type: "system",
            icon: "far fa-tv-alt"
        });
    }

    onTriggerEvent() {
        WindowManager.createStreamPreviewWindow();
    }
}

module.exports = new StreamPreviewQuickAction().toJson();