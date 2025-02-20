import Fuse, { IFuseOptions } from "fuse.js";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { ReplaceVariable } from "../../../../types/variables";

const model: ReplaceVariable = {
    definition: {
        handle: "arrayFuzzySearch",
        usage: "arrayFuzzySearch[array, search, propertyPaths?, defaultValue?, threshold?, ignoreDiacritics?]",
        description: "Finds the first element in an array that is closest to the given search. You can optionally include a threshold between 0.0 and 1.0 to filter results where 0.0 is strict and 1.0 is loose, and ignore diacritics on characters (ie é, à, ç, ñ)",
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
            },
            {
                usage: 'arrayFuzzySearch["[\\"apple\\", \\"banana\\", \\"cherry\\"]", apfl, nothing, null, 0.2]',
                description: 'Returns the default text "nothing" as the search results are all outside the threshold'
            },
            {
                usage: 'arrayFuzzySearch["[\\"piñata\\"]", pinata, null, nothing, 0.0, true]',
                description: 'Returns the text "piñata" with threshold set to find only exact matches because diacritics are ignored'
            }
        ]
    },
    evaluator: async (
        _trigger,
        subject: string | unknown[],
        search: string,
        propertyPaths?: string | unknown[],
        defaultValue?: unknown,
        threshold?: string | number,
        ignoreDiacritics?: string | boolean
    ) => {
        if (defaultValue === undefined) {
            defaultValue = "null";
        }

        if (typeof subject === "string" || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch (error) {
                return defaultValue;
            }
        }

        if (!Array.isArray(subject)) {
            return defaultValue;
        }

        const options: IFuseOptions<unknown> = {};

        if (propertyPaths != null && propertyPaths !== "null" && propertyPaths !== '') {
            if (typeof propertyPaths === "string" || propertyPaths instanceof String) {
                try {
                    propertyPaths = JSON.parse(`${propertyPaths}`);
                } catch (error) {
                    propertyPaths = [propertyPaths];
                }
            }
            options.keys = propertyPaths as Array<string>;
        }

        if (threshold != null && threshold !== "null" && threshold !== '') {
            try {
                threshold = parseFloat(`${threshold}`);

                if (!isNaN(threshold)) {
                    options.threshold = threshold;
                }
            } catch (error) {
                console.error(error);
            }
        }

        if (ignoreDiacritics && ignoreDiacritics !== "false") {
            options.ignoreDiacritics = true;
        }

        const fuse = new Fuse(subject, options);

        const result = fuse.search(search);

        if (!result.length) {
            return defaultValue;
        }

        return result[0].item;
    }
};

export default model;