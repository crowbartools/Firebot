"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const model = {
    definition: {
        id: "firebot:channelProgression",
        name: "Give Progression (Deprecated)",
        description: "Give hearts to a user, or take them away.",
        icon: "fad fa-heart",
        hidden: true,
        categories: [EffectCategory.COMMON, EffectCategory.CHAT_BASED, EffectCategory.MODERATION],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    optionsTemplate: `
    <eos-container header="Invalid Effect">
        <div class="effect-info alert alert-info" style="margin-bottom:0;">
            This effect was built for Mixer and no longer works.
        </div>
    </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: () => {
        let errors = [];
        return errors;
    },
    onTriggerEvent: async () => true
};

module.exports = model;
