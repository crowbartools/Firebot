import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "if",
        usage: "if[condition, when_true, when_false]",
        description: 'Returns the parameter based on the condition\'s result.',
        examples: [
            {
                usage: 'if[$user === Jim, JIM]',
                description: "Returns JIM if the user is Jim, otherwise returns empty text"
            },
            {
                usage: 'if[$user === Jim, JIM, JOHN]',
                description: "Returns JIM if the user is Jim, otherwise returns JOHN"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL],
        spoof: true
    }
};

export default model;