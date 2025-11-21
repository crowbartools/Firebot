import type { ReplaceVariable } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "NOR",
        usage: "NOR[condition, condition, ...]",
        description: 'Returns true if all of the conditions return false',
        examples: [
            {
                usage: 'NOR[a === b, b === c]',
                description: "Returns true as a does not equal be and b does not equals c"
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["bool"],
        spoof: true
    }
};

export default model;