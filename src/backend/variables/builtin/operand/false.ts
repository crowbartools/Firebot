import type { ReplaceVariable } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "false",
        description: "Returns a literal false boolean value; Useful in comparisons such as in $if[]",
        usage: "false",
        categories: ["advanced"],
        possibleDataOutput: ["bool"]
    },
    evaluator: () => false
};
export default model;