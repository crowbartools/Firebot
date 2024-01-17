import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import readApi from './api-read';

const model: ReplaceVariable = {
    definition: {
        handle: "rawReadApi",
        usage: "rawReadApi[url]",
        description: '(Depreciated: use $readApi) Calls the given URL and returns the response as an object.',
        examples: [
            {
                usage: 'rawReadApi[url, object.path.here]',
                description: "Traverse a JSON response object."
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: (...args: unknown[]) : unknown => {
        return readApi(...args);
    }
};

export default model;