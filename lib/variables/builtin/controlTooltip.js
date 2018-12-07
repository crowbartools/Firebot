"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = true;

const model = {
    definition: {
        handle: "controlTooltip",
        description: "The control/button's tooltip.",
        triggers: triggers
    },
    evaluator: (trigger) => {
        return trigger.metadata.control.tooltip;
    }
};

module.exports = model;
