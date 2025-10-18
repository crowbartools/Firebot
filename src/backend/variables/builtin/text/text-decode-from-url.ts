import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { stringify } from '../../../utils';

const model : ReplaceVariable = {
    definition: {
        handle: "decodeFromUrl",
        description: "Decodes input text from a URL-encoded string",
        usage: "decodeFromUrl[text]",
        examples: [
            {
                usage: `decodeFromUrl["Hello%20World%21"]`,
                description: `Returns "Hello World!"`
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
        return decodeURIComponent(stringify(subject));
    }
};

export default model;
