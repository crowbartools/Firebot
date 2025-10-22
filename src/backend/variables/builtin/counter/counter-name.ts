import { TriggersObject } from "../../../../types/triggers";
import { ReplaceVariable } from "../../../../types/variables";

const triggers: TriggersObject = {
    counter: true
};

const model: ReplaceVariable = {
    definition: {
        handle: "counterName",
        description: "The name of the counter",
        triggers: triggers,
        categories: ["trigger based", "text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.counter.name;
    }
};

export default model;