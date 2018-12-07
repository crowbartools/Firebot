"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = true;

const model = {
    definition: {
        handle: "controlActiveState",
        description: "The control/button's active state (true/false).",
        triggers: triggers
    },
    evaluator: (trigger) => {
        return trigger.metadata.control.active;
    }
};

module.exports = model;
