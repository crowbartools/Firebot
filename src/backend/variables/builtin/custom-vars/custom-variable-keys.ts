import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import customVariableKeysRaw from './custom-variable-keys-raw';

const model : ReplaceVariable = {
    definition: {
        handle: "customVariableKeys",
        usage: "customVariableKeys[name]",
        examples: [
            {
                usage: "customVariableKeys[name, 1]",
                description: "Get the array of keys for an object which is an array item by providing an array index as a second argument."
            },
            {
                usage: "customVariableKeys[name, property]",
                description: "Get the array of keys for an object property by providing a property path (using dot notation) as a second argument."
            }
        ],
        description: "Get the array of keys for an object saved in the custom variable.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        name: string,
        propertyPath: string
    ) : string => {
        const keys = customVariableKeysRaw.evaluator(trigger, name, propertyPath);
        return JSON.stringify(keys);
    }
};


export default model;