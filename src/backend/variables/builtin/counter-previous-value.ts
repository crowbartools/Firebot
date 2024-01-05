import { TriggersObject } from "../../../types/triggers";
import { ReplaceVariable } from "../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";

const triggers: TriggersObject = {
    counter: true
};

const model: ReplaceVariable = {
    definition: {
        handle: "counterPreviousValue",
        description: "The previous value of the counter",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER, VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata.counter.previousValue;
    }
};

export = model;