"use strict";

const { EffectCategory, EffectDependency } = require('../../../shared/effect-constants');
const twitchChat = require("../../chat/twitch-chat");

const effect = {
    definition: {
        id: "firebot:announcement",
        name: "Announce",
        description: "Send an announcement to your chat",
        icon: "fad fa-bullhorn",
        categories: [EffectCategory.COMMON, EffectCategory.CHAT_BASED, EffectCategory.TWITCH],
        dependencies: [EffectDependency.CHAT]
    },
    optionsTemplate: `
        <eos-chatter-select effect="effect" title="Announce as"></eos-chatter-select>

        <eos-container header="Message" pad-top="true">
            <textarea ng-model="effect.message" class="form-control" name="text" placeholder="Enter message" rows="4" cols="40" replace-variables></textarea>
            <div style="color: #fb7373;" ng-if="effect.message && effect.message.length > 500">Announcement messages cannot be longer than 500 characters. This message will get automatically chunked into multiple messages if it's too long after all replace variables have been populated.</div>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: ({ message }) => {
        const errors = [];
        if (message?.length < 1) {
            errors.push("Announcement message can't be blank.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {

        const { message, chatter } = effect;

        await twitchChat.sendAnnouncement(message, chatter);

        return true;
    }
};

module.exports = effect;
