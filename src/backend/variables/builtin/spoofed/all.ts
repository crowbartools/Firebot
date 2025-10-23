import type { ReplaceVariable } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "ALL",
        description: 'Returns true if all of the conditions are true. Only works within $if[]',
        usage: "ALL[condition, condition, ...]",
        examples: [
            {
                usage: 'ALL[a === a, b === b]',
                description: "Returns true as a equals a and b equals b"
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["bool"],
        spoof: true
    }
};

export default model;