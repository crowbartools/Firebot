import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "&name",
        usage: "&name[...path?]",
        description: "Retrieves the value for an effectOutput. If path is specified, walks the item before returning the value",
        examples: [
            {
                usage: '&example',
                description: "Returns the value of the effectOutput 'example'; Synonymous with $effectOutput[example]"
            },
            {
                usage: '&example[path, to, value]',
                description: "Returns the value of the effectOutput 'example'; Synonymous with $effectOutput[example, path.to.value]"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL],
        spoof: true
    }
};

export default model;