// Migration: todo - Need implementation details

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["mixer:progression-levelup"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "userRankBadgeUrl",
        description: "The image url to the rank badge a viewer is currently in.",
        hidden: true,
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.rankBadgeUrl || "";
    }
};

module.exports = model;
