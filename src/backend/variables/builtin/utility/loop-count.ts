import type { ReplaceVariable } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "loopCount",
        usage: "loopCount",
        description: "0 based count for the current loop iteration inside of a Loop Effects effect",
        categories: ["advanced"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.loopCount || 0;
    }
};

export default model;