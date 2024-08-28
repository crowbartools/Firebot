"use strict";

module.exports = {
    id: "firebot:previous-rank",
    name: "Previous Rank",
    description: "Filter to a given previous rank",
    events: [
        { eventSourceId: "firebot", eventId: "viewer-rank-updated" }
    ],
    comparisonTypes: ["is", "is not"],
    valueType: "preset",
    presetValues: (viewerRanksService) => {
        return viewerRanksService
            .rankLadders
            .flatMap(l => l
                .ranks
                .map(r => ({ value: r.id, display: `${r.name} (${l.name})`}))
            );
    },
    valueIsStillValid: (filterSettings, viewerRanksService) => {
        const ladderWithRank = viewerRanksService
            .rankLadders
            .find(l => l.ranks?.some(r => r.id === filterSettings.value));

        return ladderWithRank != null;
    },
    getSelectedValueDisplay: (filterSettings, viewerRanksService) => {
        const ladderWithRank = viewerRanksService
            .rankLadders
            .find(l => l.ranks?.some(r => r.id === filterSettings.value));

        const rank = ladderWithRank?.ranks?.find(r => r.id === filterSettings.value);

        return rank ? `${rank?.name} (${ladderWithRank?.name})` : "Not set";
    },

    predicate: async (filterSettings, eventData) => {
        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const { newRankId } = eventMeta;

        const isRank = newRankId === value;

        switch (comparisonType) {
            case "is":
                return isRank;
            case "is not":
                return !isRank;
            default:
                return false;
        }
    }
};