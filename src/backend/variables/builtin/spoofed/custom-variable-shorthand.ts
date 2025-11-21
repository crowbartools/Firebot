import type { ReplaceVariable } from "../../../../types/variables";

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
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["ALL"],
        spoof: true
    }
};

export default model;