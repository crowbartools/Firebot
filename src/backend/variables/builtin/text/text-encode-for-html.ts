import { encode } from 'he';

import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { convertToString } from '../../../utility';

const model : ReplaceVariable = {
    definition: {
        handle: "encodeForHtml",
        description: "Encodes input text for safe use within HTML templates",
        usage: "encodeForHtml[text]",
        categories: [VariableCategory.TEXT],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        text: unknown
    ) : string => {
        return encode(convertToString(text));
    }
};

export default model;


