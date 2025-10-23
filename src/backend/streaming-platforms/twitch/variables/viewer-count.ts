import type { ReplaceVariable, TriggersObject } from "../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:shoutout-sent", "twitch:shoutout-received"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "viewerCount",
        description: "The number of viewers that saw the event occur",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.viewerCount;
    }
};

export default model;