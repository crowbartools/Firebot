import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:power-up",
    name: "Power-up",
    description: "Filter to a Custom Power-up",
    events: [{ eventSourceId: "twitch", eventId: "power-up-redemption" }],
    eventMetaKey: "powerUpId",
    allowIsNot: true,
    presetValues: async (backendCommunicator: any) => {
        const powerUps = await backendCommunicator.fireEventAsync("power-ups:get-all");
        return powerUps.map(p => ({ value: p.id, display: p.twitchData.title }));
    },
    valueIsStillValid: async (filterSettings, backendCommunicator: any) => {
        const powerUps = await backendCommunicator.fireEventAsync("power-ups:get-all");
        return powerUps.some(p => p.id === filterSettings.value);
    }
});

export default filter;
