import type { ReplaceVariable } from "../../../../types/variables";
import type { TriggersObject } from "../../../../types/triggers";

const triggers: TriggersObject = {
    counter: true
};

const model: ReplaceVariable = {
    definition: {
        handle: "counterChange",
        description: "How much the counter has increased/decreased",
        triggers: triggers,
        categories: ["trigger based", "numbers"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.counter.value - trigger.metadata.counter.previousValue;
    }
};

export default model;