import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "textContains",
        usage: "textContains[text, search]",
        description: "Returns true if text contains search, otherwise returns false",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
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