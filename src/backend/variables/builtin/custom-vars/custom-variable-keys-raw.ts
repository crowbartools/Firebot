import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const customVariableManager = require("../../../common/custom-variable-manager");

function isObject(data: unknown) {
    return typeof data === 'object' && !(data instanceof String);
}

const model : ReplaceVariable = {
    definition: {
        handle: "rawCustomVariableKeys",
        usage: "rawCustomVariableKeys[name]",
        examples: [
            {
                usage: "rawCustomVariableKeys[name, property|index]",
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
    ) : Array<unknown> => {
        const data = customVariableManager.getCustomVariable(name, propertyPath);
        if (data == null || !isObject(data)) {
            return [];
        }

        return Object.keys(data);
    }
};


export default model;
