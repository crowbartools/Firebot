import type { ReplaceVariable } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "true",
        description: "Returns a literal true boolean value; Useful in comparisons such as in $if[]",
        usage: "true",
        categories: ["advanced"],
        possibleDataOutput: ["bool"]
    },
    evaluator: () => true
};
export default model;