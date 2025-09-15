import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import base64Encode from '../text/base64-encode';

const model: ReplaceVariable = {
    definition: {
        handle: 'btoa',
        usage: 'btoa[string]',
        description: 'Encodes a string into base64.',
        examples: [
            {
                usage: 'btoa["Hello, World!"]',
                description: 'Encodes the string "Hello, World!" in to base64 (yielding "SGVsbG8sIFdvcmxkIQ==").'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: base64Encode.evaluator
};

export default model;
