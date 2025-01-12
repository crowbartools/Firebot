import { decode } from 'he';

import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { convertToString } from '../../../utility';

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
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        text: unknown
    ) => {
        return decode(convertToString(text));
    }
};

export default model;