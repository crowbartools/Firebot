import Fuse, { IFuseOptions } from "fuse.js";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { ReplaceVariable } from "../../../../types/variables";

const model: ReplaceVariable = {
    definition: {
        handle: "arrayFuzzySearch",
        usage: "arrayFuzzySearch[array, search, propertyPaths?]",
        description: "Finds the first element in an array that is closest to the given search value",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER],
        examples: [
            {
                usage: 'arrayFuzzySearch["[\\"apple\\", \\"banana\\", \\"cherry\\"]", apfl]',
                description: 'Returns the text "apple"'
            },
            {
                usage: 'arrayFuzzySearch["[{\\"username\\": \\"ebiggz\\"},{\\"username\\": \\"Oceanity\\"}]", eggz, username]',
                description: 'Finds object with username of "ebiggz"'
            },
            {
                usage: 'arrayFuzzySearch["[{\\"username\\": \\"ebiggz\\",\\"id\\": 1234567},{\\"username\\": \\"Oceanity\\",\\"id\\": 9876543}]", 2455678, "[\\"username\\",\\"id\\"]"]',
                description: 'Searches objects using multiple properties for a match'
            }
        ]
    },
    evaluator: async (_trigger, subject: string | unknown[], search: string, propertyPaths?: string | unknown[]) => {
        if (typeof subject === "string" || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch (error) {
                return "null";
            }
        }

        if (!Array.isArray(subject)) {
            return "null";
        }

        const options: IFuseOptions<unknown> = {};

        if (propertyPaths) {
            if (typeof propertyPaths === "string" || propertyPaths instanceof String) {
                try {
                    propertyPaths = JSON.parse(`${propertyPaths}`);
                } catch (error) {
                    propertyPaths = [propertyPaths];
                }
            }
            options.keys = propertyPaths as Array<string>;
        }

        const fuse = new Fuse(subject, options);

        const result = fuse.search(search);

        if (!result.length) {
            return "null";
        }

        return result[0].item;
    }
};

export default model;