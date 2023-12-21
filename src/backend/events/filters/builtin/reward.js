"use strict";

module.exports = {
    id: "firebot:reward",
    name: "Reward",
    description: "Filter to a Custom Channel Reward",
    events: [
        { eventSourceId: "twitch", eventId: "channel-reward-redemption" }
    ],
    comparisonTypes: ["is", "is not"],
    valueType: "preset",
    presetValues: backendCommunicator => {
        return backendCommunicator
            .fireEventAsync("get-channel-rewards").then(rewards =>
                rewards.map(r => ({value: r.id, display: r.title})));
    },
    valueIsStillValid: (filterSettings, backendCommunicator) => {
        return new Promise(resolve => {
            backendCommunicator
                .fireEventAsync("get-channel-rewards").then(rewards => {
                    resolve(rewards.some(r => r.id === filterSettings.value));
                });
        });
    },
    getSelectedValueDisplay: (filterSettings, backendCommunicator) => {
        return new Promise(resolve => {
            backendCommunicator
                .fireEventAsync("get-channel-rewards").then(rewards => {
                    const reward = rewards.find(r => r.id === filterSettings.value);

                    resolve(reward ? reward.title : "Unknown Reward");
                });
        });
    },
    predicate: (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        // normalize
        const actual = eventMeta.rewardId;
        const expected = value;

        switch (comparisonType) {
            case "is":
                return actual === expected;
            case "is not":
                return actual !== expected;
            default:
                return false;
        }
    }
};