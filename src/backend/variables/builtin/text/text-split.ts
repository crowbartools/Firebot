import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "splitText",
        description: "Splits text with the given separator and returns an array. Useful for Custom Variables.",
        usage: "splitText[text, separator]",
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown,
        separator: unknown = ","
    ) : string[] => {
        if (subject == null) {
            return [];
        }
        return stringify(subject).split(stringify(separator));
    }
};

export default model;
