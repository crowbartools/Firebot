"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const logger = require('../../logwrapper');

const model = {
    definition: {
        handle: "objectWalkPath",
        description: "Returns the json value from an JSON object at the given dot-notated path",
        usage: "objectWalkPath[jsonText, path.to.value]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, subject, propertyPath) => {
        if (
            subject == null ||
            (
                typeof subject !== 'string' &&
                !(subject instanceof String)
            ) ||
            (`${subject}`) === ''
        ) {
            return "null";
        }

        try {
            subject = JSON.parse(`${subject}`);
        } catch (ignore) {
            logger.error("Invalid JSON object specified");
            return "null";
        }
        if (subject == null) {
            return "null";
        }

        if (propertyPath == null || propertyPath.length < 1) {
            logger.error("Property path must be specified");
            return null;
        }

        let cursor = subject;
        const props = propertyPath.split('.');

        while (props.length) {
            cursor = subject[props.shift()];
            if (cursor == null) {
                return "null";
            }
        }
        return JSON.stringify(cursor);
    }
};

module.exports = model;