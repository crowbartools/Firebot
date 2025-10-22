import { TriggersObject } from "../../../../types/triggers";
import { ReplaceVariable } from "../../../../types/variables";

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