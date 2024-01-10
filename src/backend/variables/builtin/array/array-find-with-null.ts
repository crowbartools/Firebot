import { Trigger } from '../../../../types/triggers';
import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import arrayFindIndex from "./array-find-index";

const model : ReplaceVariable = {
    definition: {
        handle: "arrayFindWithNull",
        usage: "arrayFindWithNull[array, matcher, propertyPath]",
        description: "Finds a matching element in the array or returns a literal null",
        examples: [
            {
                usage: 'arrayFind["[1,2,3]", 1]',
                description: "Finds 1 in the array"
            },
            {
                usage: 'arrayFind["[{\\"username\\": \\"ebiggz\\"},{\\"username\\": \\"MageEnclave\\"}]", ebiggz, username]',
                description: 'Finds object with username of "ebiggz"'
            },
            {
                usage: 'arrayFind[rawArray, value]',
                description: 'Searches each item in the array for "value" and returns the first matched item'
            },
            {
                usage: 'arrayFind[rawArray, value, key]',
                description: 'Searches each item in the array for an item that has a "key" property that equals "value"'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },

    evaluator: (_: Trigger, subject: string | unknown[], matcher, propertyPath : string = null) => {
        if (typeof subject === 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch (ignore) {
                return "null";
            }
        }
        if (!Array.isArray(subject)) {
            return "null";
        }

        const index = <number>arrayFindIndex.evaluator(_, subject, matcher, propertyPath);
        if (index == null) {
            return "null";
        }
        return subject[index];
    }
};

export default model;