import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "arrayJoin",
        description: "Returns a string with each array item joined together with the given separator",
        usage: "arrayJoin[array, separator]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },

    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    evaluator: (_: unknown, subject: string | unknown[], separator : string = ",") : string => {
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