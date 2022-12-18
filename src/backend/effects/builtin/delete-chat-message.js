"use strict";
const twitchApi = require("../../twitch-api/api");
const { EffectCategory, EffectTrigger, EffectDependency } = require('../../../shared/effect-constants');

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = ["twitch:chat-message"];

const model = {
    definition: {
        id: "firebot:delete-chat-message",
        name: "Delete Chat Message",
        description: "Delete the associated chat message",
        icon: "fad fa-comment-times",
        categories: [EffectCategory.CHAT_BASED, EffectCategory.ADVANCED, EffectCategory.TWITCH],
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
        const { trigger } = event;

        let messageId = null;
        if (trigger.type === EffectTrigger.COMMAND) {
            messageId = trigger.metadata.chatMessage.id;
        } else if (trigger.type === EffectTrigger.EVENT) {
            // if trigger is event, build chat message from chat event data
            messageId = trigger.metadata.eventData.chatMessage.id;
        }

        if (messageId) {
            await twitchApi.chat.deleteChatMessage(messageId);
        }

        return true;
    }
};

module.exports = model;
