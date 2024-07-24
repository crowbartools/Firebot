"use strict";

module.exports = {
    id: "firebot:rank-ladder",
    name: "Rank Ladder",
    description: "Filter to a given rank ladder",
    events: [
        { eventSourceId: "firebot", eventId: "viewer-rank-updated" }
    ],
    comparisonTypes: ["is", "is not"],
    valueType: "preset",
    presetValues: (viewerRanksService) => {
        return viewerRanksService
            .rankLadders
            .map(l => ({value: l.id, display: l.name}));
    },
    valueIsStillValid: (filterSettings, viewerRanksService) => {
        const ladder = viewerRanksService.getRankLadder(filterSettings.value);
        return ladder != null;
    },
    getSelectedValueDisplay: (filterSettings, viewerRanksService) => {
        const ladder = viewerRanksService.getRankLadder(filterSettings.value);
        return ladder?.name ?? "Not set";
    },

    predicate: async (filterSettings, eventData) => {
        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const {rankLadderId } = eventMeta;

        const isLadder = rankLadderId === value;

        switch (comparisonType) {
            case "is":
                return isLadder;
            case "is not":
                return !isLadder;
            default:
                return false;
        }
    }
};