import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "trimStart",
        description: "Removes any whitespace from the beginning of input text.",
        usage: "trimStart[text]",
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
        return stringify(subject).trimStart();
    }
};

export default model;
