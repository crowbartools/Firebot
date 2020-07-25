// Migration: todo - Needs implementation details

"use strict";
const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.EVENT] = ["mixer:messages-purged"];

const model = {
    definition: {
        handle: "timeoutDuration",
        description: "How long the user is timed out for. Ie '1m' or '30s'",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let modEventData = trigger.metadata.eventData.data;
        if (modEventData.cause) {
            return modEventData.cause.durationString || "UnknownDuration";
        }
    }
};

module.exports = model;
