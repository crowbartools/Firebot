"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const toggleConnection = {
    definition: {
        id: "firebot:toggleconnection",
        name: "Toggle Twitch Connection",
        description: "Toggles connection to Twitch",
        icon: "fad fa-plug",
        categories: [EffectCategory.ADVANCED],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <p>This effect toggles connection to Twitch services when ran.</p>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: () => {
        let errors = [];
        return errors;
    },
    onTriggerEvent: async () => {
        const connectionManager = require("../../common/connection-manager");
        await connectionManager.updateChatConnection(!connectionManager.chatIsConnected());
    }
};

module.exports = toggleConnection;
