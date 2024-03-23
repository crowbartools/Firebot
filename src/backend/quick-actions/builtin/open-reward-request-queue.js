"use strict";

const QuickAction = require("../quick-action");
const frontendCommunicator = require("../../common/frontend-communicator");

class OpenRewardQueueQuickAction extends QuickAction {
    constructor() {
        super({
            id: "firebot:open-reward-request-queue",
            name: "Open Reward Request Queue",
            type: "system",
            icon: "far fa-line-columns"
        });
    }

    onTriggerEvent() {
        frontendCommunicator.send("trigger-quickaction:reward-queue");
    }
}

module.exports = new OpenRewardQueueQuickAction().toJson();