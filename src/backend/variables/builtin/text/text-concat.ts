import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { convertToString } from '../../../utility';

const model : ReplaceVariable = {
    definition: {
        handle: "concat",
        description: "Appends text together",
        usage: "concat[text, text, ...]",
        examples: [
            {
                usage: `concat[Hello, " ", World]`,
                description: `Returns "Hello World"`
            }
        ],
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        ...args: unknown[]
    ) : string => {
        return args.map(convertToString).join('');
    }
};

export default model;