import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const nth = (n: number) : string => ["st", "nd", "rd"][(((n < 0 ? -n : n) + 90) % 100 - 10) % 10 - 1] || "th";

const model : ReplaceVariable = {
    definition: {
        handle: "ordinalIndicator",
        description: "Adds an ordinal indicator suffix to a number (ie 'st', 'nd', 'rd')",
        usage: "ordinalIndicator[number]",
        categories: ["numbers"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown
    ) : unknown => {
        const number = Number(subject);
        if (subject == null || !Number.isFinite(number)) {
            return subject;
        }
        return `${number}${nth(number)}`;
    }
};

export default model;
