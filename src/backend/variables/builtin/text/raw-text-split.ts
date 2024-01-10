import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import textSplit from "./text-split";

const model : ReplaceVariable = {
    definition: {
        handle: "rawSplitText",
        description: "(Deprecated: use $splitText) Splits text with the given separator and returns an array. Useful for Custom Variables.",
        usage: "rawSplitText[text, separator]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT],
        hidden: true
    },
    evaluator: textSplit.evaluator
};

export default model;
