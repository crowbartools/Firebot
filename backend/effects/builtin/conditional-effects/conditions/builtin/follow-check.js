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

        let triggerUserId = trigger.metadata.userId;
        let triggerUsername = trigger.metadata.username;

        let followListString = rightSideValue;

        if (followListString == null) {
            return false;
        }

        if (triggerUserId == null) {
            const mixerAPi = require("../../../../../mixer-api/api");
            const channelData = await mixerAPi.channels.getChannel(triggerUsername);
            if (channelData) {
                triggerUserId = channelData.userId;
            }
        }

        let followCheckList = followListString.split(',')
            .filter(f => f != null)
            .map(f => f.toLowerCase().trim());

        let followCheck = await userAccess.userFollowsChannels(triggerUserId, followCheckList);
        return followCheck;
    }
};