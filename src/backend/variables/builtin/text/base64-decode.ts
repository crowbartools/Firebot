import type { ReplaceVariable } from "../../../../types/variables";

import logger from '../../../logwrapper';
import { stringify } from '../../../utils';

const model: ReplaceVariable = {
    definition: {
        handle: 'base64Decode',
        usage: 'base64Decode[string]',
        description: 'Decodes a base64 encoded string. If the string is not valid base64, it will return an empty string.',
        examples: [
            {
                usage: 'base64Decode[SGVsbG8sIFdvcmxkIQ==]',
                description: 'Decodes the base64 string "SGVsbG8sIFdvcmxkIQ==" back to "Hello, World!".'
            },
            {
                usage: 'base64Decode[test string]',
                description: 'Returns an empty string because "test string" is not valid base64.'
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },
    evaluator: (_, text: unknown): string => {
        const decoder = new TextDecoder();
        try {
            return decoder.decode(Uint8Array.from(atob(stringify(text)), c => c.charCodeAt(0)));
        } catch {
            logger.error(`Failed to decode base64 string: ${stringify(text)}`);
            return "";
        }
    }
};

export default model;
