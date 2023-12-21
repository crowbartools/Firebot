"use strict";

module.exports = {
    id: "firebot:username",
    name: "Username",
    description: "Condition based on a username",
    comparisonTypes: ["is", "is not", "contains", "matches regex"],
    leftSideValueType: "none",
    rightSideValueType: "text",
    predicate: (conditionSettings, trigger) => {

        const { comparisonType, rightSideValue } = conditionSettings;

        // normalize usernames
        const triggerUsername = trigger.metadata.username ? trigger.metadata.username.toLowerCase() : "";
        const conditionUsername = rightSideValue ? rightSideValue.toLowerCase() : "";

        switch (comparisonType) {
            case "is":
                return triggerUsername === conditionUsername;
            case "is not":
                return triggerUsername !== conditionUsername;
            case "contains":
                return triggerUsername.includes(conditionUsername);
            case "matches regex": {
                const regex = new RegExp(conditionUsername, "gi");
                return regex.test(triggerUsername);
            }
            default:
                return false;
        }
    }
};