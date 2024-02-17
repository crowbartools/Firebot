import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "#name",
        usage: "#name",
        description: 'Retrieves the preset-list arg of the give name',
        examples: [
            {
                usage: '#example',
                description: "Returns the value of the preset-list arg 'example'; Synonymous with $presetListArgs[example]"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ALL],
        spoof: true
    }
};

export default model;