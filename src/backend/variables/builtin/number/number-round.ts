import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "round",
        description: "Rounds the given number to the nearest whole number.",
        usage: "round[num]",
        examples: [
            {
                usage: "round[num, places]",
                description: "Rounds the given number to the specified number of decimal places."
            }
        ],
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, subject: number | string, places) => {
        subject = Number(subject);
        if (Number.isNaN(subject)) {
            return 0;
        }

        places = Number(places);
        if (Number.isNaN(places) || places < 0 || places > 50) {
            return Math.round(subject);
        }

        return subject.toFixed(places);
    }
};

export default model;