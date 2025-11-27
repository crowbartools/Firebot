import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "floor",
        description: "Rounds down the given number to the nearest whole number.",
        usage: "floor[num]",
        examples: [
            {
                usage: "floor[3.7]",
                description: "Returns 3"
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

        return Math.floor(subject);
    }
};

export default model;