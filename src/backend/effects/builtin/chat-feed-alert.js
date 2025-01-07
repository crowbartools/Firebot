"use strict";

const { EffectCategory, EffectDependency } = require('../../../shared/effect-constants');
const frontendCommunicator = require('../../common/frontend-communicator');

const effect = {
    definition: {
        id: "firebot:chat-feed-alert",
        name: "Chat Feed Alert",
        description: "Display an alert in Firebot's chat feed",
        icon: "fad fa-comment-exclamation",
        categories: [EffectCategory.COMMON, EffectCategory.CHAT_BASED],
        dependencies: [EffectDependency.CHAT]
    },
    optionsTemplate: `
    <eos-container>
        <p>Use this effect to send yourself alerts in Firebot's chat feed without using actual chat messages. This means the alerts are only visible to you.</p>
    </eos-container>
    <eos-container header="Alert Message" pad-top="true">
        <firebot-input
            model="effect.message"
            use-text-area="true"
            placeholder-text="Enter message"
            rows="4"
            cols="40"
            menu-position="under"
        />
    </eos-container>

    `,
    optionsController: () => {},
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.message == null || effect.message === "") {
            errors.push("Alert message can't be blank.");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {

        const { effect } = event;

        frontendCommunicator.send("chatUpdate", {
            fbEvent: "ChatAlert",
            message: effect.message
        });

        return true;
    }
};

module.exports = effect;
