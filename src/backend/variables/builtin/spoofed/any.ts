import type { ReplaceVariable } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "ANY",
        usage: "ANY[condition, condition, ...]",
        description: 'Returns true if any of the conditions are true. Only works within $if[]',
        examples: [
            {
                usage: 'ANY[a === b, c === c]',
                description: "Returns true as c equals c"
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["bool"],
        spoof: true
    }
};

export default model;