import type { ReplaceVariable } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "null",
        description: "Returns a literal null value; Useful in comparisons such as in $if[]",
        usage: "null",
        categories: ["advanced"],
        possibleDataOutput: ["null"]
    },
    evaluator: () => null
};
export default model;