import type { ReplaceVariable, TriggersObject } from "../../../../../../types";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:watch-streak"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "channelPointsAwarded",
        description: "The number of channel points awarded to the viewer",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.channelPointsAwarded || 0;
    }
};

export default model;