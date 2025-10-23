import type { ReplaceVariable } from "../../../../types/variables";
import { ReplaceVariableManager } from "../../replace-variable-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "evalVars",
        usage: "evalVars[text]",
        description: "Evaluate $variables in a string of text. Useful for evaluating text $vars from an external source (ie a txt file or API)",
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger, text = "") => {
        return await ReplaceVariableManager.populateStringWithTriggerData(text as string, trigger);
    }
};

export default model;
