import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "encodeForUrl",
        description: "Encodes input text for use in a URL",
        usage: "encodeForUrl[text]",
        examples: [
            {
                usage: "encodeForUrl[Hello World!]",
                description: `Returns "Hello%20World%21"`
            }
        ],
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown
    ) : string => {
        if (subject == null) {
            return '';
        }
        return encodeURIComponent(stringify(subject));
    }
};

export default model;
