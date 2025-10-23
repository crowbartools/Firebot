import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:ad-break-upcoming",
    "twitch:ad-break-start",
    "twitch:ad-break-end"
];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "adBreakDuration",
        description: "The duration of the triggered ad break, in seconds",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        const adBreakDuration = trigger.metadata?.eventData?.adBreakDuration ?? 0;

        return adBreakDuration;
    }
};

export default model;