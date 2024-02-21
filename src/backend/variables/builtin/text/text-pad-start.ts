import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "textPadStart",
        description: "Pads the start of text",
        usage: "textPadStart[input, count, countIsLength, padChar]",
        examples: [
            {
                usage: "textPadStart[input, count, $false, \" \"]",
                description: "Adds 'count' number of spaces to the start of input"
            },
            {
                usage: "textPadStart[input, count, $true, \" \"]",
                description: "Adds spaces to the start of the input until the length of the output equals 'count'"
            }
        ],
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator(trigger: Trigger, input: string, count: number, countIsLength: null | string | boolean, padChar: null | string = " ") {
        if (input === null) {
            return '';
        }
        input = `${input}`;

        // verify count
        count = Number(count);
        if (!Number.isInteger(count) || count < 0) {
            return '';
        }

        if (padChar == null || padChar === '') {
            padChar = " ";
        }
        padChar = `${padChar}`;

        if (
            countIsLength != null &&
            countIsLength !== 'null' &&
            countIsLength !== false &&
            countIsLength !== 'false' &&
            countIsLength !== '$false' &&
            <unknown>countIsLength !== 0 &&
            countIsLength !== '0' &&
            countIsLength !== ''
        ) {
            const charsToAdd = count - input.length;
            if (charsToAdd < 1) {
                return input;
            }
            return `${padChar.repeat(charsToAdd)}${input}`;
        }

        return `${padChar.repeat(count)}${input}`;
    }
};

export default model;