// Migration: todo - interactive related?

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");
const { ControlKind } = require('../../interactive/constants/MixplayConstants');

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = [ControlKind.TEXTBOX];

const model = {
    definition: {
        handle: "textboxInput",
        description: "The textbox input.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata.inputData.value;
    }
};

module.exports = model;
