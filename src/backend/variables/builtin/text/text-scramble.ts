import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "scrambleText",
        usage: "scrambleText[text]",
        description: "Scrambles the input text",
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown
    ) : string => {
        const text = stringify(subject).split('');

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