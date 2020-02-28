"use strict";
const chat = require("../../common/mixer-chat");
const effectModels = require("../models/effectModels");
const { EffectTrigger, EffectDependency } = effectModels;

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = ["mixer:chat-message"];

const model = {
    definition: {
        id: "firebot:delete-chat-message",
        name: "Delete Chat Message",
        description: "Deletes the associated chat message",
        tags: ["Logic control", "Built in"],
        dependencies: [EffectDependency.CHAT],
        triggers: triggers
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <p>This effect deletes the associated chat message (for a Command or Chat Message Event)</p>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: () => {},
    onTriggerEvent: async event => {
        let { trigger } = event;

        let messageId = null;
        if (trigger.type === EffectTrigger.COMMAND) {
            messageId = trigger.metadata.chatEvent.id;
        } else if (trigger.type === EffectTrigger.EVENT) {
            // if trigger is event, build chat message from chat event data
            messageId = trigger.metadata.eventData.data.id;
        }

        if (messageId) {
            chat.deleteChat(messageId);
        }

        return true;
    }
};

module.exports = model;
