import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "trimEnd",
        description: "Removes any whitespace from the end of input text.",
        usage: "trimEnd[text]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown
    ) : string => {
        if (subject == null) {
            return '';
        }
        return stringify(subject).trimEnd();
    }
};

export default model;
