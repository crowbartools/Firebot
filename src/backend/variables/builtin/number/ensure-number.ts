import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "ensureNumber",
        description: "Guarantees a number output. If the input is a number, it is passed through. If it's not, the given default number is used instead.",
        usage: "ensureNumber[input, defaultNumber]",
        categories: ["numbers"],
        possibleDataOutput: ["number"]
    },
    evaluator: (
        trigger: Trigger,
        input: unknown,
        defaultNumber: unknown
    ) : number => {
        if (input != null && input !== '' && Number.isFinite(Number(input))) {
            return Number(input);
        }

        return Number.isFinite(Number(defaultNumber)) ? Number(defaultNumber) : 0;
    }
};

export default model;
