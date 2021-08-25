"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger, EffectDependency } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const logger = require('../../logwrapper');
const twitchChat = require("../../chat/twitch-chat");

const model = {
    definition: {
        id: "firebot:clearchat",
        name: "Clear Chat",
        description: "Clear all chat messages.",
        icon: "fad fa-eraser",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION],
        dependencies: [EffectDependency.CHAT],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
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
