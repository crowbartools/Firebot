import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "convertFromJSON",
        description: "Converts JSON text into a raw object instance",
        usage: "convertFromJSON[json text]",
        examples: [
            {
                usage: `convertFromJSON['{"name": "John", "age": 30}']`,
                description: "Returns a raw object from JSON string"
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        jsonText: unknown
    ) : unknown => {
        if (jsonText == null) {
            return null;
        }
        if (typeof jsonText === 'string' || jsonText instanceof String) {
            try {
                return JSON.parse(`${jsonText.toString()}`);

            } catch {
                return "[PARSE ERROR]";
            }
        }
        return jsonText;
    }
};

export default model;