"use strict";

const ComparisonType = Object.freeze({
    IS: "is",
    IS_NOT: "is not",
    GREATER_THAN: "greater than",
    GREATER_THAN_OR_EQUAL_TO: "greater than or equal to",
    LESS_THAN: "less than",
    LESS_THAN_OR_EQUAL_TO: "less than or equal to",
    CONTAINS: "contains",
    MATCHES_REGEX: "matches regex"
});

exports.ComparisonType = ComparisonType;