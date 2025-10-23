import { encode } from 'he';

import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "encodeForHtml",
        description: "Encodes input text for safe use within HTML templates",
        usage: "encodeForHtml[text]",
        examples: [
            {
                usage: "encodeForHtml[<p>Hello & Welcome!</p>]",
                description: `Returns "&lt;p&gt;Hello &amp; Welcome!&lt;/p&gt;"`
            }
        ],
        categories: ["text"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        text: unknown
    ) : string => {
        return encode(stringify(text));
    }
};

export default model;
