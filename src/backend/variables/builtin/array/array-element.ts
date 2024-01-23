import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "arrayElement",
        usage: "arrayElement[array, index]",
        description: "Returns the element at the given index of the input array.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },

    evaluator: (
        trigger: Trigger,
        subject: string | Array<unknown>,
        index: number | string
    ) : unknown => {
        if (typeof subject === 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);

            //eslint-disable-next-line no-empty
            } catch (ignore) {
                return null;
            }
        }

        if (subject == null || subject[index] == null) {
            return null;
        }

        return subject[index];
    }
};

export default model;