import { TriggersObject } from "../../../../types/triggers";
import { ReplaceVariable } from "../../../../types/variables";

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