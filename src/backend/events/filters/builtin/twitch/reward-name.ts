import { createTextFilter } from "../../filter-factory";

const filter = createTextFilter({
    id: "firebot:reward-name",
    name: "Reward Name",
    caseInsensitive: true,
    description: "Filter to a Custom Channel Reward by Name",
    eventMetaKey: "rewardName",
    events: [
        { eventSourceId: "twitch", eventId: "channel-reward-redemption" }
    ]
});

export default filter;