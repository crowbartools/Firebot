import { ReplaceVariable, Trigger } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import { evalSandboxedJs } from '../../../../common/handlers/custom-scripts/sandbox-js-eval/sandbox-eval';

const model : ReplaceVariable = {
    definition: {
        handle: "evalJs",
        usage: "evalJs[`` code ``, ...parameters]",
        description: 'Evaluates the given js in a sandboxed browser instance.<br/><br/>Parameters can be accessed via parameters[N] within the js.<br/>Event metadata can be accessed via metadata.*<br/><br/>You must use return to return a result from the evaluation.',
        examples: [
            {
                usage: 'evalJs[``return parameters[0]``, test]',
                description: 'Returns the first parameter passed to $evalJS: "test"'
            },
            {
                usage: 'evalJs[``return metadata.username``]',
                description: 'Returns the username from the event\'s metadata'
            },
            {
                usage: 'evalJs[``return await Firebot.sum[1,2,3,4]``]',
                description: 'Calls the sum firebot api and returns the result'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL]
    },
    evaluator: (trigger: Trigger, code: string, ...args: unknown[]) => {
        return evalSandboxedJs(code, args, trigger.metadata);
    }
};

export default model;