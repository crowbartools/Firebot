"use strict";

const { wildcardToRegex } = require('../../../../../utility');

module.exports = {
    id: "firebot:username",
    name: "Username",
    description: "Condition based on a username",
    comparisonTypes: ["is", "is not", "contains", "matches wildcard", "matches regex"],
    leftSideValueType: "none",
    rightSideValueType: "text",
    predicate: (conditionSettings, trigger) => {

        let { comparisonType, leftSideValue, rightSideValue } = conditionSettings;

        // normalize usernames
        let triggerUsername = trigger.metadata.username ? trigger.metadata.username.toLowerCase() : "";
        let conditionUsername = rightSideValue ? rightSideValue.toLowerCase() : "";

        switch (comparisonType) {
        case "is":
            return triggerUsername === conditionUsername;
        case "is not":
            return triggerUsername !== conditionUsername;
        case "contains":
            return triggerUsername.includes(conditionUsername);
        case "matches wildcard":
            return !!wildcardToRegex(rightSideValue || "").test(triggerUsername);
        case "matches regex": {
            let regex = new RegExp(conditionUsername, "gi");
            return regex.test(triggerUsername);
        }
        default:
            return false;
        }
    }
};