import type { ReplaceVariable } from "../../../../types/variables";
import base64Decode from './base64-decode';

const model: ReplaceVariable = {
    definition: {
        handle: 'atob',
        usage: 'atob[string]',
        description: 'Decodes a base64 encoded string. If the string is not valid base64, it will return an empty string.',
        examples: [
            {
                usage: 'atob[SGVsbG8sIFdvcmxkIQ==]',
                description: 'Decodes the base64 string "SGVsbG8sIFdvcmxkIQ==" back to "Hello, World!".'
            },
            {
                usage: 'atob[test string]',
                description: 'Returns an empty string because "test string" is not valid base64.'
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },
    evaluator: base64Decode.evaluator
};

export default model;
