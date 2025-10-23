import type { ReplaceVariable } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "NOT",
        usage: "NOT[condition]",
        description: 'Returns the opposite of the condition\'s result. Only works within $if[]',
        examples: [
            {
                usage: 'NOT[1 === 1]',
                description: "Returns false as the condition is true"
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["bool"],
        spoof: true
    }
};

export default model;