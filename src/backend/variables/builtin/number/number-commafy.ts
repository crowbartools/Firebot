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
            },
            {
                usage: "commafy[1000000, 2]",
                description: `Returns "1,000,000.00"`
            }
        ],
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        subject: number | string,
        places: null | number | string
    ) : string => {
        const number = Number(subject);
        const numPlaces = Number(places);
        if (!Number.isFinite(number)) {
            return "[Error: not a number]";
        }

        if (!Number.isNaN(numPlaces)) {
            const number = Number(subject).toPrecision(numPlaces);
            const [integer, fraction] = `${number}.0`.split(/\./g);
            return `${integer.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction}`;
        }

        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
};

export default model;
