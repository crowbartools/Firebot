import type { ReplaceVariable, TriggersObject } from "../../../../../../types/variables";


const triggers: TriggersObject = {};
triggers["manual"] = true;
triggers["event"] = ["twitch:timeout"];

const model : ReplaceVariable = {
    definition: {
        handle: "timeoutDuration",
        description: "How long the user is timed out for in minus",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.timeoutDuration || 0;
    }
};

export default model;
