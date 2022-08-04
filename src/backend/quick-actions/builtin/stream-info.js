"use strict";

const SystemQuickAction = require("../quick-action");
const frontendCommunicator = require("../../common/frontend-communicator");

class StreamInfoQuickAction extends SystemQuickAction {
    constructor() {
        super({
            id: "firebot:stream-info",
            name: "Edit Stream Info",
            type: "system",
            icon: "far fa-pencil"
        });
    }

    onTriggerEvent() {
        frontendCommunicator.send("trigger-quickaction:stream-info");
    }
}

module.exports = new StreamInfoQuickAction().toJson();