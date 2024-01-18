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

const fuzzyMatch = (value: unknown, match: unknown) : boolean => {
    if (value == null || value === '') {
        return match == null || match === '';
    }

    const strValue = `${value}`.toLowerCase();
    if (value === true || strValue === "true" || value === false || strValue === "false") {
        return match === true || match === "true" || match === false || match === "false";
    }

    if (Number.isFinite(Number(value))) {
        if (!Number.isFinite(Number(match))) {
            return false;
        }
        return Number(value) === Number(match);
    }

    return value === match;
};

const model : ReplaceVariable = {
    definition: {
        handle: "arrayFilter",
        description: "Returns a new filtered array.",
        usage: "arrayFilter[array, matcher, propertyPath, removeMatches]",
        examples: [
            {
                usage: 'arrayFilter["[1,2,3]", 1, null, false]',
                description: "Filter out anything that doesn't equal 1 (new array: [1])"
            },
            {
                usage: 'arrayFilter["[1,2,3]", 1, null, true]',
                description: 'Filter out anything that equals 1 (new array: [2,3])'
            },
            {
                usage: 'arrayFilter["[{\\"username\\": \\"ebiggz\\"},{\\"username\\": \\"MageEnclave\\"}]", ebiggz, username, true]',
                description: 'Filter out anything that has a username property which equals "ebiggz" (new array: [{\\"username\\": \\"MageEnclave\\"}])'
            },
            {
                usage: 'arrayFilter[rawArray, 1, null, false]',
                description: "Filter out anything that doesn't equal 1"
            },
            {
                usage: 'arrayFilter[rawArray, 1, null, true]',
                description: 'Filter out anything that equals 1'
            },
            {
                usage: 'arrayFilter[rawArray, value, key, true]',
                description: 'Filter out any item in the array that has a key property twitch equals "value"'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        subject: string | unknown[],
        matcher: string,
        propertyPath: string = null,
        removeMatches: null | boolean | string = false
    ) : Array<unknown> => {
        if (typeof subject === 'string' || subject instanceof String) {
            try {
                subject = JSON.parse(`${subject}`);
            } catch (ignore) {
                return [];
            }
        }

        if (!Array.isArray(subject)) {
            return [];
        }

        if (matcher === undefined || matcher === "") {
            return subject;
        }

        removeMatches = removeMatches === true || removeMatches === 'true';

        if (propertyPath == null || propertyPath === 'null' || propertyPath === "") {
            return subject.filter(removeMatches
                ? value => !fuzzyMatch(value, matcher)
                : value => fuzzyMatch(value, matcher)
            );
        }

        return subject.filter(removeMatches
            ? value => !fuzzyMatch(getPropertyAtPath(value, propertyPath), matcher)
            : value => fuzzyMatch(getPropertyAtPath(value, propertyPath), matcher)
        );
    }
};

export default model;