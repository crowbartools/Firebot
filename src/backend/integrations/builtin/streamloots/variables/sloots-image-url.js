"use strict";

const { EffectTrigger } = require("../../../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:purchase", "streamloots:redemption"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsImageUrl",
        description: "The image url for the StreamLoots Chest/Card",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.INTEGRATION],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const imageUrl = trigger.metadata.eventData && trigger.metadata.eventData.imageUrl;

        return imageUrl || "";
    }
};

module.exports = model;
