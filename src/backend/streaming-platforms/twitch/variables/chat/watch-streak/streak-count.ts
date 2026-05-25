import type { ReplaceVariable, TriggersObject } from "../../../../../../types";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:watch-streak"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "streakCount",
        description: "The number of consecutive streams watched in the current streak",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.streakCount || 0;
    }
};

export default model;