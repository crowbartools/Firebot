import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "arraySlice",
        description: "Returns a slice of an array (see [JavaScript `Array.slice()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/slice) for info on start/end behavior)",
        usage: "arraySlice[array, start, end]",
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        subject: string | unknown[],
        start?: string | number,
        end?: string | number
    ) : unknown[] => {
        if (typeof subject === "string" || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch (ignore) {
                return [];
            }
        }
        if (!Array.isArray(subject)) {
            return [];
        }

        start = start !== "" ? Number(start) : 0;
        if (Number.isNaN(start)) {
            start = 0;
        }

        end = end !== "" ? Number(end) : subject.length;
        if (Number.isNaN(end)) {
            end = subject.length;
        }

        return [...subject].slice(start, end);
    }
};

export default model;