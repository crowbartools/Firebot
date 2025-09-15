import { sprintf } from 'sprintf-js';
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { ReplaceVariable } from "../../../../types/variables";
import { convertToString } from '../../../utility';

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
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    async evaluator(_, template: unknown, ...args: unknown[]): Promise<string> {
        return sprintf(convertToString(template), ...args);
    }
};

export default model;
