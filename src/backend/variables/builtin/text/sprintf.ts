import { sprintf } from 'sprintf-js';
import type { ReplaceVariable } from "../../../../types/variables";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: 'sprintf',
        usage: 'sprintf[template, ...values]',
        description: 'Formats a string using the specified template and values.',
        examples: [
            {
                usage: 'sprintf["Hello, %s!", "World"]',
                description: 'Formats the string into "Hello, World!".'
            },
            {
                usage: 'sprintf["%d + %d = %d", 2, 3, 5]',
                description: 'Formats the string into "2 + 3 = 5".'
            },
            {
                usage: 'sprintf["%s tipped $%0.2f", "Alice", 5]',
                description: 'Formats the string into "Alice tipped $5.00".'
            }
        ],
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (_, template: unknown, ...args: unknown[]): string => {
        return sprintf(stringify(template), ...args);
    }
};

export default model;
