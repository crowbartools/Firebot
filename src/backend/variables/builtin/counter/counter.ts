import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import counterManager from "../../../counters/counter-manager";

const model: ReplaceVariable = {
    definition: {
        handle: "counter",
        usage: "counter[name]",
        description: "Displays the value of the given counter.",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, name: string) => {
        const counter = counterManager.getItemByName(name);
        return counter ? counter.value : -1;
    }
};

export default model;