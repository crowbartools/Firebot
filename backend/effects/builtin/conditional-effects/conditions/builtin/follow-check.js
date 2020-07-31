"use strict";

const userAccess = require("../../../../../common/user-access");

module.exports = {
    id: "firebot:followcheck",
    name: "Follow Check",
    description: "Condition based on if user is following all people in a comma separated list.",
    comparisonTypes: ["follows"],
    leftSideValueType: "none",
    rightSideValueType: "text",
    predicate: async (conditionSettings, trigger) => {
        let { rightSideValue } = conditionSettings;

        let triggerUsername = trigger.metadata.username;
        let followListString = rightSideValue;

        if (followListString == null) {
            return false;
        }

        let followCheckList = followListString.split(',')
            .filter(f => f != null)
            .map(f => f.toLowerCase().trim());

        let followCheck = await userAccess.userFollowsChannels(triggerUsername, followCheckList);
        return followCheck;
    }
};