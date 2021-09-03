"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "wildcardMatch",
        usage: "wildcardMatch[subject, pattern]",
        description: "Returns true if the given subject matches the wildcard pattern",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, stringToEvaluate, pattern) => {
        const regex = new RegExp(
            '^' + pattern
                // removing lead/trailing whitespace
                .trim()

                // escape non irrelevent alpha-numeric characters
                .replace(/[^\w\s?*]/g, '\\$&')

                // convert wildcard special characters to regex equivulants
                // ? = any 1 character
                // * = 0 or more characters
                .replace(/[?*]+/gi, match => {
                    const hasAstrick = match.indexOf('*') > -1;
                    const qs = match.split('?').length - 1;
                    if (!qs) {
                        return '.*';
                    }
                    return '.'.repeat(qs) + (hasAstrick ? '+' : '');
                }) + '$',
            'i'
        );
        return !!regex.test(stringToEvaluate);
    }
};

module.exports = model;