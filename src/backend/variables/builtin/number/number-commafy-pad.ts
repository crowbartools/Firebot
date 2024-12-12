import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "commafyPad",
        description: "Adds the appropriate commas to a number with decimal padding.",
        usage: "commafyPad[value, precision(between 0 and 100)]",
        examples: [
            {
                usage: "commafyPad[1000000.00, 100]",
                description: `Returns "1,000,000.0000"`
            }
        ],
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        value: string | number,
        //places: string | number,
        precision?: string | number
    ) : string => {
        const number = Number(value).toFixed(precision != null ? Number(precision) : 2);
        //const numPlaces = Number(places);
        const [integer, fraction] = `${number}.0`.split(/\./g);

        return `${integer.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction}`;
    }
};

export default model;