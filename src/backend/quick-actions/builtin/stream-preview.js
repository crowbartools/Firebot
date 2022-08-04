"use strict";

const SystemQuickAction = require("../quick-action");
const windowManagement = require("../../app-management/electron/window-management");

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
        windowManagement.createStreamPreviewWindow();
    }
}

module.exports = new StreamPreviewQuickAction().toJson();