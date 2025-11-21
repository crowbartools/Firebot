import type { ReplaceVariable } from "../../../../types/variables";
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
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },
    evaluator: base64Encode.evaluator
};

export default model;
