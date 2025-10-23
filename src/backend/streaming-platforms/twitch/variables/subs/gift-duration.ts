import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:subs-gifted"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "giftSubDuration",
        description: "The amount of months is gifted in case of a multi-month gift sub.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.giftDuration || 1;
    }
};

export default model;
