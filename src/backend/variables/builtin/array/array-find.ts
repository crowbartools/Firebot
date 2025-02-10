import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import arrayFindIndex from "./array-find-index";

const model : ReplaceVariable = {
    definition: {
        handle: "arrayFind",
        usage: "arrayFind[array, matcher, propertyPath?, exact?]",
        description: "Finds a matching element in the array or returns the text 'null'",
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
                usage: 'arrayFind["[0,1,2,"1"]", 1, null, true]',
                description: "Returns the text '1'"
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

    evaluator: (
        trigger: Trigger,
        subject: string | unknown[],
        matcher: unknown,
        propertyPath : string = null,
        //eslint-disable-next-line @typescript-eslint/no-inferrable-types
        exact : boolean | string = false
    ) : unknown => {
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

        const index = <number>arrayFindIndex.evaluator(trigger, subject, matcher, propertyPath, exact);
        if (index == null) {
            return "null";
        }
        return subject[index];
    }
};

export default model;