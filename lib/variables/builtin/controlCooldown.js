"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const { ControlKind } = require('../../interactive/constants/MixplayConstants');

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = [ControlKind.BUTTON, ControlKind.TEXTBOX];

const model = {
    definition: {
        handle: "controlCooldown",
        description: "The control's cooldown length.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata.control.mixplay.cooldown;
    }
};

module.exports = model;
