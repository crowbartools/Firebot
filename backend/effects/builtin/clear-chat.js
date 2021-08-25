"use strict";

const effectModels = require("../models/effectModels");
const { EffectDependency } = effectModels;
const { EffectCategory } = require('../../../shared/effect-constants');
const logger = require('../../logwrapper');
const twitchChat = require("../../chat/twitch-chat");

/** @type {import("../models/effectModels").Effect} */
const model = {
    definition: {
        id: "firebot:clearchat",
        name: "Clear Chat",
        description: "Clear all chat messages.",
        icon: "fad fa-eraser",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION],
        dependencies: [EffectDependency.CHAT]
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect will clear all chat messages from chat, exactly like the Mixer /clear command.</p>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: () => {
        let errors = [];
        return errors;
    },
    onTriggerEvent: async () => {
        await twitchChat.clearChat();
        logger.debug("Chat was cleared via the clear chat effect.");
        return true;
    }
};

module.exports = model;
