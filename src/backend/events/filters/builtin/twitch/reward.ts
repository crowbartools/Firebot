import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:reward",
    name: "Reward",
    description: "Filter to a Custom Channel Reward",
    events: [
        { eventSourceId: "twitch", eventId: "channel-reward-redemption" }
    ],
    eventMetaKey: "rewardId",
    allowIsNot: true,
    presetValues: async (backendCommunicator: any) => {
        const rewards = await backendCommunicator.fireEventAsync("get-channel-rewards");
        return rewards.map(r => ({value: r.id, display: r.twitchData.title}));
    },
    valueIsStillValid: async (filterSettings, backendCommunicator: any) => {
        const rewards = await backendCommunicator.fireEventAsync("get-channel-rewards");
        return rewards.some(r => r.id === filterSettings.value);
    }
});

export default filter;