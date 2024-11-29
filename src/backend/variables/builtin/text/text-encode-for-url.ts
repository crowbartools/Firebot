import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { convertToString } from '../../../utility';

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
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        subject: unknown
    ) : string => {
        if (subject == null) {
            return '';
        }
        return encodeURIComponent(convertToString(subject));
    }
};

export default model;
