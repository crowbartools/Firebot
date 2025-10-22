import { TriggersObject } from "../../../../types/triggers";
import { ReplaceVariable } from "../../../../types/variables";

const triggers: TriggersObject = {
    counter: true
};

const model: ReplaceVariable = {
    definition: {
        handle: "counterPreviousValue",
        description: "The previous value of the counter",
        triggers: triggers,
        categories: ["trigger based", "numbers"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.counter.previousValue;
    }
};

export default model;