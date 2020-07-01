"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

/**
 * The Cooldown effect
 */
const cooldown = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:cooldown",
        name: "Cooldown Controls (Deprecated)",
        description: "Put specific MixPlay controls on cooldown.",
        icon: "fad fa-hourglass-half",
        categories: [EffectCategory.MIXPLAY, EffectCategory.ADVANCED],
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
            This effect was built for Mixer and no longer works.
        </div>
    </eos-container>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: () => {},
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: () => {
        let errors = [];
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async () => true
};

module.exports = cooldown;