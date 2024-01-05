"use strict";

module.exports = {
    id: "firebot:custom",
    name: "Custom",
    description: "Condition based on custom values (useful with $variables)",
    comparisonTypes: ["is", "is not", "is strictly", "is not strictly", "is less than", "is less than or equal to", "is greater than", "is greater than or equal to", "contains", "does not contain", "matches regex", "does not match regex"],
    leftSideValueType: "text",
    rightSideValueType: "text",
    predicate: (conditionSettings) => {

        let { comparisonType, leftSideValue, rightSideValue } = conditionSettings;

        if (comparisonType !== "is strictly" && comparisonType !== "is not strictly") {
            if (!isNaN(leftSideValue)) {
                leftSideValue = Number(leftSideValue);
            }
            if (!isNaN(rightSideValue)) {
                rightSideValue = Number(rightSideValue);
            }
        }


        switch (comparisonType) {
            case "is":
                return leftSideValue == rightSideValue; //eslint-disable-line eqeqeq
            case "is not":
                return leftSideValue != rightSideValue; //eslint-disable-line eqeqeq
            case "is strictly":
                return leftSideValue === rightSideValue;
            case "is not strictly":
                return leftSideValue !== rightSideValue;
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
            case "matches regex": {
                const regex = new RegExp(rightSideValue, "gi");
                return regex.test(leftSideValue);
            }
            case "does not match regex": {
                const regex = new RegExp(rightSideValue, "gi");
                return !regex.test(leftSideValue);
            }
            default:
                return false;
        }
    }
};