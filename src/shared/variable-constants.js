"use strict";

/**
 * Enum for a variable's possible output data type.
 * @readonly
 * @enum {string}
 */
const OutputDataType = Object.freeze({
    NULL: "null",
    BOOLEAN: "bool",
    NUMBER: "number",
    TEXT: "text",
    ARRAY: "array",
    OBJECT: "object",
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
    ADVANCED: "advanced",
    INTEGRATION: "integrations",
    OBS: "obs"
});

exports.OutputDataType = OutputDataType;
exports.VariableCategory = VariableCategory;