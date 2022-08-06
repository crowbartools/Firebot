"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');
const frontendCommunicator = require("../../common/frontend-communicator");

const model = {
    definition: {
        id: "firebot:mark-all-activity-acknowledged",
        name: "Mark All Activity As Acknowledged",
        description: "Marks all Activity as acknowledged on the Chat page",
        icon: "fad fa-comment-dots",
        categories: [EffectCategory.COMMON],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container pad-top="true">
            <p>When this effect is ran, all activity in the Activity Feed on the Chat page will be marked as acknowledged. Useful on a hotkey or hooked up to a StreamDeck to quickly acknowledge all current activity.</p>
        </eos-container>
    `,
    optionsController: () => {},
    onTriggerEvent: async () => {

        frontendCommunicator.fireEventAsync("acknowledge-all-activity");

        return true;
    }
};

module.exports = model;
