import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const getPropertyAtPath = (subject: unknown, path: string) => {
    if (subject == null) {
        return subject;
    }
    const nodes = path.split(".");
    for (const node of nodes) {
        subject = subject[node];
        if (subject == null) {
            return subject;
        }
    }
    return subject;
};

const fuzzyMatch = (value: unknown, match: unknown) : boolean => {
    if (value == null || value === '') {
        return match == null || value === '';
    }
    if (value === true || value === "true" || value === false || value === "false") {
        return match === true || match === "true" || match === false || match === "false";
    }
    if (Number.isInteger(Number(value))) {
        return Number.isInteger(Number(match));
    }
    return value === match;
};

const model : ReplaceVariable = {
    definition: {
        handle: "arrayFindIndex",
        usage: "arrayFindIndex[array, matcher, propertyPath]",
        description: "Finds a matching element in the array and returns it's index, or null if the element is absent",
        examples: [
            {
                usage: 'arrayFindIndex["[\\"a\\",\\"b\\",\\"c\\"]", b]',
                description: 'Returns 1 , the index of "b"'
            },
            {
                usage: 'arrayFindIndex["[{\\"username\\": \\"alastor\\"},{\\"username\\": \\"ebiggz\\"}]", alastor, username]',
                description: 'Returns 0, the index of the object where "username"="alastor"'
            },
            {
                usage: 'arrayFindIndex[rawArray, b]',
                description: 'Returns 1, the index of "b"'
            },
            {
                usage: 'arrayFindIndex[rawArray, value, key]',
                description: 'Searches the array for an item with a key with the value of "value"'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER]
    },
    evaluator: (_: unknown, subject: string | unknown[], matcher, propertyPath : string = null) => {
        if (typeof subject === 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch (ignore) {
                return null;
            }
        }
        if (!Array.isArray(subject)) {
            return null;
        }

        if (propertyPath == null || propertyPath === 'null' || propertyPath === "") {
            const index = subject.findIndex(value => fuzzyMatch(value, matcher));
            return index === -1 ? null : index;
        }

        const index = subject.findIndex(value => fuzzyMatch(getPropertyAtPath(value, propertyPath), matcher));
        return index === -1 ? null : index;
    }
};

export default model;