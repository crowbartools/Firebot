import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "ceil",
        description: "Rounds up the given number to the nearest whole number.",
        usage: "ceil[num]",
        examples: [
            {
                usage: "ceil[3.2]",
                description: "Returns 4"
            }
        ],
        categories: ["numbers"],
        possibleDataOutput: ["number"]
    },
    evaluator: (
        trigger: Trigger,
        subject: number | string
    ) : number => {
        subject = Number(subject);
        if (!Number.isFinite(subject)) {
            return 0;
        }
        return Math.ceil(subject);
    }
};

export default model;
