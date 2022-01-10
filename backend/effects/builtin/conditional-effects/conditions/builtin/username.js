"use strict";

module.exports = {
    id: "firebot:username",
    name: "Username",
    description: "Condition based on a username",
    comparisonTypes: ["is", "is not", "contains", "matches regex"],
    leftSideValueType: "none",
    rightSideValueType: "text",
    predicate: (conditionSettings, trigger) => {

        let { comparisonType, rightSideValue } = conditionSettings;

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
        case "matches regex": {
            let regex = new RegExp(conditionUsername, "gi");
            return regex.test(triggerUsername);
        }
        default:
            return false;
        }
    }
};