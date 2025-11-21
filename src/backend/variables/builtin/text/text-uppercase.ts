import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "uppercase",
        description: "Makes the entire given text string uppercase.",
        usage: "uppercase[text]",
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        text: unknown
    ) : string => {
        return stringify(text).toUpperCase();
    }
};

export default model;