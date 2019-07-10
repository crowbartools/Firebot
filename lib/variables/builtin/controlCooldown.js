"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = true;

const model = {
    definition: {
        handle: "controlCooldown",
        description: "The control's cooldown length.",
        triggers: triggers
    },
    evaluator: (trigger) => {
        return trigger.metadata.control.mixplay.cooldown;
    }
};

module.exports = model;
