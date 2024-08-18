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

const fuzzyMatch = (value: unknown, match: unknown, exact: boolean | string) : boolean => {

    // Inputs are an exact match
    if (value === match) {
        return true;
    }

    // An input is literal NaN; This deviates from IEEE as it treats NaNs as equiv
    if (Number.isNaN(value) || Number.isNaN(match)) {
        return Number.isNaN(value) && Number.isNaN(match);
    }

    // Exact match is required
    exact = typeof exact === 'string' ? exact.toLowerCase() : exact;
    if (exact === true || exact === 'true') {
        return false;
    }

    // Treat null and empty strings as equiv
    const matchIsNull = match == null || match === '';
    if (value == null || value === '') {
        return matchIsNull;
    }
    if (matchIsNull) {
        return false;
    }

    // Make inputs case-insensitive for checks
    const ciValue = typeof value === 'string' ? value.toLowerCase() : value;
    const ciMatch = typeof match === 'string' ? match.toLowerCase() : match;

    // falsy check
    if (
        (value == null || value === '' || value === false || ciValue === 'false') &&
        (match == null || match === '' || match === false || ciMatch === 'false')
    ) {
        return true;
    }

    // Treat true and "true" as equiv
    const matchIsTrue = match === true || ciMatch === 'true';
    if (value === true || ciValue === 'true') {
        return matchIsTrue;
    }
    if (matchIsTrue) {
        return false;
    }

    // Treat false and "false" as equiv
    const matchIsFalse = match === false || ciMatch === 'false';
    if (value === false || ciValue === 'false') {
        return matchIsFalse;
    }
    if (matchIsFalse) {
        return false;
    }

    // After this point, we'll only accept string/numeric values for comparison
    if (
        (typeof value !== 'number' && typeof value !== 'string') ||
        (typeof match !== 'number' && typeof match !== 'string')
    ) {
        return false;
    }

    // Treat numerical strings as numbers
    const numValue = Number(value);
    const numMatch = Number(match);
    if (Number.isNaN(numValue) || Number.isNaN(numMatch)) {
        return false;
    }
    return numValue === numMatch;
};

const model : ReplaceVariable = {
    definition: {
        handle: 'arrayFindIndex',
        usage: 'arrayFindIndex[array, matcher, propertyPath?, exact?]',
        description: "Finds a matching element in the array and returns its index, or null if the element is absent",
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
                usage: 'arrayFindIndex["[0,1,2,"1"]", "1", null, $true]',
                description: 'Returns 3, the index of the text "1"'
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

        if (propertyPath == null || propertyPath === 'null' || propertyPath === '') {
            const index = subject.findIndex(value => fuzzyMatch(value, matcher, exact));
            return index === -1 ? null : index;
        }

        const index = subject.findIndex(value => fuzzyMatch(getPropertyAtPath(value, propertyPath), matcher, exact));
        return index === -1 ? null : index;
    }
};

export default model;