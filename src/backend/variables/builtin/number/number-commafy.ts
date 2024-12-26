import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "commafy",
        description: "Adds the appropriate commas to a number.",
        usage: "commafy[number]",
        examples: [
            {
                usage: "commafy[1000000]",
                description: `Returns "1,000,000"`
            }
        ],
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown
    ) : string => {
        const number = Number(subject);
        if (!Number.isFinite(number)) {
            return "[Error: not a number]";
        }
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
};

export default model;
