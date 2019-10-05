"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");
const { ControlKind } = require('../../interactive/constants/MixplayConstants');

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = [ControlKind.BUTTON];

const model = {
    definition: {
        handle: "controlText",
        description: "The control's text.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.control.text;
    }
};

module.exports = model;
