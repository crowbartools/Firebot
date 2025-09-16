import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import { convertToString } from '../../../utility';

const model: ReplaceVariable = {
    definition: {
        handle: 'base64Encode',
        usage: 'base64Encode[string]',
        description: 'Encodes a string into base64.',
        examples: [
            {
                usage: 'base64Encode["Hello, World!"]',
                description: 'Encodes the string "Hello, World!" in to base64 (yielding "SGVsbG8sIFdvcmxkIQ==").'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    async evaluator(_, text: unknown): Promise<string> {
        const encoder = new TextEncoder();
        return btoa(String.fromCharCode(...encoder.encode(convertToString(text))));
    }
};

export default model;
