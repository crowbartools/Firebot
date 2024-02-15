import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "$name",
        usage: "$name[...path?]",
        description: 'Retrieves the value for a customVariable. If path is specified, walks the item before returning the value',
        examples: [
            {
                usage: '$example',
                description: "Returns the value of the customVariable 'example'; Synonymous with $customVariable[example]"
            },
            {
                usage: '$example[path, to, value]',
                description: "Returns the value of the customVariable 'example'; Synonymous with $customVariable[example, path.to.value]"
            },
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL],
        spoof: true
    }
};

export default model;