import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "textContains",
        usage: "textContains[text, search]",
        description: "Returns true if text contains search, otherwise returns false",
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown = "",
        search: unknown = ""
    ) : boolean => {
        return stringify(subject).includes(stringify(search));
    }
};

export default model;