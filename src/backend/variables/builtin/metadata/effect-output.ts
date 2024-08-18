import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "effectOutput",
        usage: "effectOutput[name]",
        examples: [
            {
                usage: "effectOutput[name, 1]",
                description: "Get an array item by providing an array index as a second argument."
            },
            {
                usage: "effectOutput[name, property]",
                description: "Get a property by providing a property path (using dot notation) as a second argument."
            },
            {
                usage: "effectOutput[name, null, exampleString]",
                description: "Set a default value in case the effect output doesn't exist yet."
            },
            {
                usage: "effectOutput[name, property, exampleString]",
                description: "Set a default value in case the effect output doesn't have data at the specified property path."
            }
        ],
        description: "Get data that was outputted by a prior effect.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },

    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    evaluator: (
        { effectOutputs },
        name: string,
        propertyPath: string,
        defaultData: unknown = null
    ) => {
        let data = (effectOutputs ?? {})[name];

        if (!data) {
            return defaultData;
        }

        if (propertyPath == null || propertyPath === "null" || propertyPath === '') {
            return data;
        }

        const nodes = propertyPath.split(".");

        if (typeof data === "string") {
            try {
                data = JSON.parse(data as string);
            } catch (_) { }
        }

        try {
            for (const node of nodes) {
                if (data == null) {
                    return null;
                }
                data = data[node];
            }
            return data ?? defaultData;
        } catch (error) {
            return defaultData;
        }
    }
};

export default model;