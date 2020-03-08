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
        let triggerUserId = trigger.metadata.userId ? trigger.metadata.userId : "";
        let normalizeFollowList = rightSideValue ? rightSideValue.toLowerCase() : "";

        if (normalizeFollowList === "" || triggerUserId === "") {
            return false;
        }

        let followCheckList = normalizeFollowList.replace(new RegExp(' ', 'g'), "").split(',');
        let followCheck = await userAccess.userFollowsUsers(triggerUserId, followCheckList);
        return followCheck;
    }
};