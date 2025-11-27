import type { ReplaceVariable, TriggersObject } from "../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = true;
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "eventData",
        description: "An object containing all the metadata included with the event.",
        triggers: triggers,
        categories: ["trigger based", "advanced"],
        possibleDataOutput: ["object"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData;
    }
};

export default model;