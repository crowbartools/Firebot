import type { ReplaceVariable } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "NALL",
        usage: "NALL[condition, condition, ...]",
        description: 'Returns true if any of the conditions return false',
        examples: [
            {
                usage: 'NALL[a === a, b === c]',
                description: "Returns true as b does not equals c"
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["bool"],
        spoof: true
    }
};

export default model;