"use strict";

const { EffectTrigger } = require("../../../../../shared/effect-constants");
const { OutputDataType } = require("../../../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:purchase", "streamloots:redemption"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsSoundUrl",
        description: "The sound url for the StreamLoots Chest/Card.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let soundUrl = trigger.metadata.eventData && trigger.metadata.eventData.soundUrl;

        return soundUrl || "";
    }
};

module.exports = model;
