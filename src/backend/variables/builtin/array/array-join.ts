import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "arrayJoin",
        description: "Returns a string with each array item joined together with the given separator",
        usage: "arrayJoin[array, separator]",
        examples: [
            {
                usage: `arrayJoin["[1,2,3]", ", "]`,
                description: `Returns "1, 2, 3".`
            },
            {
                usage: `arrayJoin["["apple","banana","cherry"]", " - "]`,
                description: `Returns "apple - banana - cherry".`
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },

    evaluator: (
        trigger: Trigger,
        subject: string | unknown[],
        // eslint-disable-next-line @typescript-eslint/no-inferrable-types
        separator : string = ","
    ) : string => {
        if (typeof subject === 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch (ignore) {
                return '';
            }
        }
        if (Array.isArray(subject)) {
            return subject.join(separator);
        }
        return "";
    }
};

export default model;