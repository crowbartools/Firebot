"use strict";

const { EffectDependency } = require("../models/effectModels");
const { EffectCategory } = require('../../../shared/effect-constants');

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
        <textarea ng-model="effect.message" class="form-control" name="text" placeholder="Enter message" rows="4" cols="40" replace-variables></textarea>
    </eos-container>

    `,
    optionsController: () => {},
    optionsValidator: effect => {
        let errors = [];
        if (effect.message == null || effect.message === "") {
            errors.push("Alert message can't be blank.");
        }
        return errors;
    },
    onTriggerEvent: async event => {

        const { effect } = event;

        renderWindow.webContents.send("chatUpdate", {
            fbEvent: "ChatAlert",
            message: effect.message
        });

        return true;
    }
};

module.exports = effect;
