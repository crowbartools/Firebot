"use strict";

/**
 * Enum for effect filter comparison types.
 * @readonly
 * @enum {string}
 */
const ComparisonType = Object.freeze({
    IS: "is",
    IS_NOT: "is not",
    GREATER_THAN: "greater than",
    GREATER_THAN_OR_EQUAL_TO: "greater than or equal to",
    LESS_THAN: "less than",
    LESS_THAN_OR_EQUAL_TO: "less than or equal to",
    CONTAINS: "contains",
    DOESNT_CONTAIN: "doesn't contain",
    DOESNT_STARTS_WITH: "doesn't start with",
    STARTS_WITH: "starts with",
    DOESNT_END_WITH: "doesn't end with",
    ENDS_WITH: "ends with",
    MATCHES_REGEX_CS: "matches regex",
    DOESNT_MATCH_REGEX_CS: "doesn't matches regex",
    MATCHES_REGEX: "matches regex (case insensitive)",
    DOESNT_MATCH_REGEX: "doesn't match regex (case insensitive)"
});

exports.ComparisonType = ComparisonType;