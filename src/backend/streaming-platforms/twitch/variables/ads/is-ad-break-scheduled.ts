import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:ad-break-start",
    "twitch:ad-break-end"
];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "isAdBreakScheduled",
        description: "Whether or not the triggered ad break was scheduled",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["bool"]
    },
    evaluator: (trigger) => {
        const isAdBreakScheduled = trigger.metadata?.eventData?.isAdBreakScheduled ?? false;

        return isAdBreakScheduled;
    }
};

export default model;