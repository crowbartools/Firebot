import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { convertToString } from '../../../utility';

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
        return convertToString(subject).includes(convertToString(search));
    }
};

export default model;