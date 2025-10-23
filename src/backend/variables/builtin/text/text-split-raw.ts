import type { ReplaceVariable } from "../../../../types/variables";

import textSplit from "./text-split";

const model : ReplaceVariable = {
    definition: {
        handle: "rawSplitText",
        description: "(Deprecated: use $splitText) Splits text with the given separator and returns an array. Useful for Custom Variables.",
        usage: "rawSplitText[text, separator]",
        categories: ["text"],
        possibleDataOutput: ["text"],
        hidden: true
    },
    evaluator: textSplit.evaluator
};

export default model;
