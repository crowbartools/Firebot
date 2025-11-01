import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["firebot:custom-variable-set"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "createdCustomVariableName",
        description: "Name of the created custom variable.",
        triggers: triggers,
        categories: ["trigger based", "common"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger: Trigger) : unknown => {
        return trigger.metadata.eventData.createdCustomVariableName || "";
    }
};

export default model;