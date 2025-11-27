import type { ReplaceVariable } from "../../../../types/variables";

import { stringify } from '../../../utils';

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
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },
    evaluator: (_, text: unknown): string => {
        const encoder = new TextEncoder();
        return btoa(String.fromCharCode(...encoder.encode(stringify(text))));
    }
};

export default model;
