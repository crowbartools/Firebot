import { TriggersObject } from "../../../types/triggers";
import { ReplaceVariable } from "../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";

const triggers: TriggersObject = {
    counter: true
};

const model: ReplaceVariable = {
    definition: {
        handle: "counterName",
        description: "The name of the counter",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER, VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.counter.name;
    }
};

export = model;