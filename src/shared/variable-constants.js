"use strict";

/**
 * Enum for a variable's possible output data type.
 * @readonly
 * @enum {string}
 */
const OutputDataType = Object.freeze({
    TEXT: "text",
    NUMBER: "number",
    ALL: "ALL"
});

/**
 * Enum for variable categories.
 * @readonly
 * @enum {string}
 */
const VariableCategory = Object.freeze({
    COMMON: "common",
    TRIGGER: "trigger based",
    USER: "user based",
    TEXT: "text",
    NUMBERS: "numbers",
    ADVANCED: "advanced"
});

exports.OutputDataType = OutputDataType;
exports.VariableCategory = VariableCategory;