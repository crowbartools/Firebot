import { ReplaceVariable, Trigger } from "../../../../types/variables";
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

const fuzzyMatch = (value: unknown, match: unknown, exact: boolean) : boolean => {
    if (exact) {
        return value === match;
    }

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
        usage: "arrayFindIndex[array, matcher, propertyPath?, exact?]",
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
                usage: 'arrayFindIndex["[0,1,2,"1"]", 1, null, true]',
                description: "Returns 3, the index of the text '1'"
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
    evaluator: (
        trigger: Trigger,
        subject: string | unknown[],
        matcher: unknown,
        propertyPath : string = null,
        //eslint-disable-next-line @typescript-eslint/no-inferrable-types
        exact : boolean | string = false
    ) : null | number => {
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
            const index = subject.findIndex(value => fuzzyMatch(value, matcher, exact === true || exact === 'true'));
            return index === -1 ? null : index;
        }

        const index = subject.findIndex(value => fuzzyMatch(getPropertyAtPath(value, propertyPath), matcher, exact === true || exact === 'true'));
        return index === -1 ? null : index;
    }
};

export default model;