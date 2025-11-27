import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "textSubstring",
        usage: "textSubstring[text, start, end]",
        description: "Returns a substring of the provided text based on the range",
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown = "",
        start: unknown = 0,
        end: unknown
    ) : string => {
        const text = stringify(subject);

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