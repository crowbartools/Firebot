import type { ReplaceVariable } from "../../../../types/variables";

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
        categories: ["advanced"],
        possibleDataOutput: ["ALL"],
        spoof: true
    }
};

export default model;