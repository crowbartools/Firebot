"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["mixer:hosted"];
triggers[EffectTrigger.MANUAL] = true;


const model = {
    definition: {
        handle: "hostViewerCount",
        description: "Get the number of viewers brought over by a host",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger) => {
        return trigger.metadata && trigger.metadata.eventData && trigger.metadata.eventData.viewerCount ? trigger.metadata.eventData.viewerCount : 0;
    }
};

module.exports = model;
