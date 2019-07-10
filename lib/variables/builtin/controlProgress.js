"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");

let triggers = {};
triggers[EffectTrigger.INTERACTIVE] = true;

const model = {
    definition: {
        handle: "controlProgress",
        description: "The control's progress bar percentage.",
        triggers: triggers
    },
    evaluator: (trigger) => {
        let progress = trigger.metadata.control.progress;
        return progress ? progress * 100 : 0;
    }
};

module.exports = model;
