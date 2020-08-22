"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const model = {
    definition: {
        id: "firebot:cooldown",
        name: "Cooldown Controls (Deprecated)",
        hidden: true,
        description: "Put specific MixPlay controls on cooldown.",
        icon: "fad fa-hourglass-half",
        categories: [EffectCategory.ADVANCED],
        dependencies: [EffectDependency.INTERACTIVE],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    optionsTemplate: `
    <eos-container header="Invalid Effect">
        <div class="effect-info alert alert-info" style="margin-bottom:0;">
            This effect only worked on Mixer. It now does nothing and can be removed.
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