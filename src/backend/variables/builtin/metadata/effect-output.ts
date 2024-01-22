import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "effectOutput",
        usage: "effectOutput[name]",
        description: "Get data that was outputted by a prior effect.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },

    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    evaluator: ({ effectOutputs }, name: string = "") => {
        const output = (effectOutputs ?? {})[name];
        return output || null;
    }
};

export default model;