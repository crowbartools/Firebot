import { decode } from 'he';

import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "decodeFromHtml",
        description: "Decodes input text from an HTML-encoded string",
        usage: "decodeFromHtml[text]",
        examples: [
            {
                usage: `decodeFromHtml[&lt;p&gt;Hello &amp; Welcome!&lt;/p&gt;]`,
                description: `Returns "<p>Hello & Welcome!</p>"`
            }
        ],
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        text: unknown
    ) => {
        return decode(stringify(text));
    }
};

export default model;