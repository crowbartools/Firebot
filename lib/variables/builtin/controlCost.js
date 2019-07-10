"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = true;

const model = {
    definition: {
        handle: "controlSparkCost",
        description: "The control's spark cost.",
        triggers: triggers
    },
    evaluator: (trigger) => {
        return trigger.metadata.control.mixplay.cost;
    }
};

module.exports = model;
