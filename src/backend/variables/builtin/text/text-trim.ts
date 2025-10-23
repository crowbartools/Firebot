import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "trim",
        description: "Removes any whitespace from the beginning and end of input text.",
        usage: "trim[text]",
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown
    ) : string => {
        if (subject == null) {
            return '';
        }
        return stringify(subject).trim();
    }
};

export default model;
