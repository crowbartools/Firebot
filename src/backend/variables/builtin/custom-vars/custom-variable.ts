import type { ReplaceVariable, Trigger } from "../../../../types/variables";

import customVariableRaw from './custom-variable-raw';

const model : ReplaceVariable = {
    definition: {
        handle: "customVariable",
        usage: "customVariable[name]",
        examples: [
            {
                usage: "customVariable[name, 1]",
                description: "Get an array item by providing an array index as a second argument."
            },
            {
                usage: "customVariable[name, property]",
                description: "Get a property by providing a property path (using dot notation) as a second argument."
            },
            {
                usage: "customVariable[name, null, exampleString]",
                description: "Set a default value in case the custom variable doesn't exist yet."
            }
        ],
        description: "Get the data saved in the custom variable.",
        categories: ["advanced"],
        possibleDataOutput: ["number", "text"]
    },
    evaluator: (trigger: Trigger, ...args: unknown[]) => {
        const data = customVariableRaw.evaluator(trigger, ...args);
        if (data == null) {
            return null;
        }
        if (typeof data === 'string' || data instanceof String) {
            return `${data}`;
        }
        return JSON.stringify(data);
    }
};


export default model;