import type { ReplaceVariable } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "loopItem",
        usage: "loopItem",
        description: "The item for current loop iteration inside of a Loop Effects effect using Array loop mode",
        categories: ["advanced"],
        possibleDataOutput: ["number", "text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.loopItem;
    }
};

export default model;
