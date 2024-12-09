import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:rank-ladder",
    name: "Rank Ladder",
    description: "Filter to a given rank ladder",
    events: [
        { eventSourceId: "firebot", eventId: "viewer-rank-updated" }
    ],
    eventMetaKey: "rankLadderId",
    allowIsNot: true,
    presetValues: async (viewerRanksService: any) => viewerRanksService
        .rankLadders.map(l => ({value: l.id, display: l.name})),
    valueIsStillValid: async (filterSettings, viewerRanksService: any) => viewerRanksService
        .getRankLadder(filterSettings.value) != null
});

export default filter;