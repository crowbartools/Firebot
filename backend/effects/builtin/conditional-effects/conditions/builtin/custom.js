"use strict";

const { wildcardToRegex } = require("../../../../../utility");

module.exports = {
    id: "firebot:custom",
    name: "Custom",
    description: "Condition based on custom values (useful with $variables)",
    comparisonTypes: [
        "is",
        "is not",
        "is less than",
        "is less than or equal to",
        "is greater than",
        "is greater than or equal to",
        "contains",
        "does not contain",
        "matches wildcard",
        "does not match wildcard",
        "matches regex",
        "does not match regex"
    ],
    leftSideValueType: "text",
    rightSideValueType: "text",
    predicate: (conditionSettings, trigger) => {

        let { comparisonType, leftSideValue, rightSideValue } = conditionSettings;

        if (!isNaN(leftSideValue)) {
            leftSideValue = Number(leftSideValue);
        }
        if (!isNaN(rightSideValue)) {
            rightSideValue = Number(rightSideValue);
        }

        switch (comparisonType) {
        case "is":
            return leftSideValue == rightSideValue; //eslint-disable-line eqeqeq
        case "is not":
            return leftSideValue != rightSideValue; //eslint-disable-line eqeqeq
        case "is less than":
            return leftSideValue < rightSideValue;
        case "is less than or equal to":
            return leftSideValue <= rightSideValue;
        case "is greater than":
            return leftSideValue > rightSideValue;
        case "is greater than or equal to":
            return leftSideValue >= rightSideValue;
        case "contains":
            return leftSideValue.toString().includes(rightSideValue);
        case "does not contain":
            return !leftSideValue.toString().includes(rightSideValue);
        case "matches wildcard":
            return !!wildcardToRegex(rightSideValue || '').test(leftSideValue);
        case "does not match wildcard":
            return !wildcardToRegex(rightSideValue || '').test(leftSideValue);
        case "matches regex": {
            let regex = new RegExp(rightSideValue, "gi");
            return regex.test(leftSideValue);
        }
        case "does not match regex": {
            let regex = new RegExp(rightSideValue, "gi");
            return !regex.test(leftSideValue);
        }
        default:
            return false;
        }
    }
};