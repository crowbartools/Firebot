import { ReplaceVariable, Trigger, TriggersObject } from "../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["firebot:custom-variable-set"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "createdCustomVariableData",
        description: "Data from the created custom variable.",
        triggers: triggers,
        categories: ["common"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger: Trigger) : unknown => {
        return trigger.metadata.eventData.createdCustomVariableData || "";
    }
};

export default model;
