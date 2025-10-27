import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import { CustomVariableManager } from "../../../common/custom-variable-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "rawCustomVariable",
        usage: "rawCustomVariable[name]",
        examples: [
            {
                usage: "rawCustomVariable[name, 1]",
                description: "Get an array item by providing an array index as a second argument."
            },
            {
                usage: "rawCustomVariable[name, property]",
                description: "Get a property by providing a property path (using dot notation) as a second argument."
            },
            {
                usage: "rawCustomVariable[name, null, exampleString]",
                description: "Set a default value in case the custom variable doesn't exist yet."
            }
        ],
        description: "Get the data saved in the custom variable.",
        categories: ["advanced"],
        possibleDataOutput: ["ALL"]
    },
    evaluator: (
        trigger: Trigger,
        name: string,
        propertyPath: string,
        defaultData: unknown
    ) : unknown => {
        const data = CustomVariableManager.getCustomVariable(name, propertyPath, defaultData);
        return data ?? null;
    }
};


export default model;