import type { ReplaceVariable } from "../../../../types/variables";
import type { TriggersObject } from "../../../../types/triggers";

const triggers: TriggersObject = {
    counter: true
};

const model: ReplaceVariable = {
    definition: {
        handle: "counterMaximum",
        description: "The maximum value of the counter, or an empty string if there isn't one",
        triggers: triggers,
        categories: ["trigger based", "numbers"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.counter.maximum ?? "";
    }
};

export default model;