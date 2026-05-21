import type { ReplaceVariable } from "../../../../types/variables";

const allowHtmlVariable: ReplaceVariable = {
    definition: {
        handle: "allowHtml",
        usage: "allowHtml[$otherVariable]",
        description: "Allows HTML to be used in places where it's usually not allowed",
        categories: ["advanced"],
        possibleDataOutput: ["text"],
        hidden: true
    },
    evaluator: (trigger, arg: string) => arg
};

export default allowHtmlVariable;