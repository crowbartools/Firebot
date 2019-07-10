"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = true;

const model = {
    definition: {
        handle: "controlText",
        description: "The control's text.",
        triggers: triggers
    },
    evaluator: (trigger) => {
        return trigger.metadata.control.mixplay.text;
    }
};

module.exports = model;
