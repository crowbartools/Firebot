import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:raid", "twitch:outgoing-raid-started", "twitch:raid-sent-off"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "raidViewerCount",
        description: "Get the number of viewers brought or sent over by a raid",
        triggers: triggers,
        categories: ["trigger based", "common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData?.viewerCount || 0;
    }
};

export default model;
