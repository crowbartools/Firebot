import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:reward",
    name: "Reward",
    description: "Filter to a Custom Channel Reward",
    events: [
        { eventSourceId: "twitch", eventId: "channel-reward-redemption" }
    ],
    eventMetaKey: "firebotRewardId",
    allowIsNot: true,
    presetValues: async (backendCommunicator: any) => {
        const rewards = await backendCommunicator.fireEventAsync("get-channel-rewards");
        return rewards.map(r => ({value: r.firebotId, display: r.twitchData.title}));
    },
    valueIsStillValid: async (filterSettings, backendCommunicator: any) => {
        const rewards = await backendCommunicator.fireEventAsync("get-channel-rewards");
        // Support both firebotId (new) and Twitch ID (legacy) for backward compat
        return rewards.some(r => r.firebotId === filterSettings.value || r.id === filterSettings.value
            || (r.previousTwitchIds && r.previousTwitchIds.includes(filterSettings.value)));
    }
});

export default filter;