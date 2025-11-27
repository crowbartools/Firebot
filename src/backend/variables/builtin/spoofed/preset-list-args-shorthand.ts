import type { ReplaceVariable } from "../../../../types/variables";

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
        categories: ["advanced"],
        possibleDataOutput: ["ALL"],
        spoof: true
    }
};

export default model;