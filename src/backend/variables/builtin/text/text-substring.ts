import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { convertToString } from '../../../utility';

const model : ReplaceVariable = {
    definition: {
        handle: "textSubstring",
        usage: "textSubstring[text, start, end]",
        description: "Returns a substring of the provided text based on the range",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown = "",
        start: unknown = 0,
        end: unknown
    ) : string => {
        const text = convertToString(subject);

        start = Number(start);
        if (!Number.isFinite(start) || <number>start < 1) {
            start = 1;
        }

        end = Number(end);
        if (!Number.isFinite(end)) {
            end = start;
        }

        return text.substring(<number>start - 1, <number>end);
    }
};

export default model;