import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

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
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (...args: unknown[]) => {
        const data = customVariableRaw.evaluator(...args);
        return JSON.stringify(data);
    }
};


export default model;