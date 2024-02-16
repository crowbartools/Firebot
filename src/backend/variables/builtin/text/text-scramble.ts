import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { convertToString } from '../../../utility';

const model : ReplaceVariable = {
    definition: {
        handle: "scrambleText",
        usage: "scrambleText[text]",
        description: "Scrambles the input text",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown
    ) : string => {
        const text = convertToString(subject).split('');

        let result = '';
        while (text.length) {
            const idx = Math.floor(Math.random() * text.length);
            result += text[idx];
            text.splice(idx, 1);
        }

        return result;
    }
};

export default model;