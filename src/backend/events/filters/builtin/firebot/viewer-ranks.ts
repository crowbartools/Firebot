import twitchApi from "../../../../twitch-api/api";
import viewerDatabase from "../../../../viewers/viewer-database";
import { EventFilter } from "../../../../../types/events";

const filter: EventFilter = {
    id: "firebot:viewerranks",
    name: "Viewer's Ranks",
    description: "Filter to a given viewer rank",
    events: [
        { eventSourceId: "twitch", eventId: "cheer" },
        { eventSourceId: "twitch", eventId: "subs-gifted" },
        { eventSourceId: "twitch", eventId: "sub" },
        { eventSourceId: "twitch", eventId: "prime-sub-upgraded" },
        { eventSourceId: "twitch", eventId: "gift-sub-upgraded" },
        { eventSourceId: "twitch", eventId: "follow" },
        { eventSourceId: "streamlabs", eventId: "follow" },
        { eventSourceId: "twitch", eventId: "raid" },
        { eventSourceId: "twitch", eventId: "viewer-arrived" },
        { eventSourceId: "twitch", eventId: "chat-message" },
        { eventSourceId: "twitch", eventId: "whisper" },
        { eventSourceId: "streamloots", eventId: "purchase" },
        { eventSourceId: "streamloots", eventId: "redemption" },
        { eventSourceId: "firebot", eventId: "view-time-update" }
    ],
    comparisonTypes: ["include", "doesn't include"],
    valueType: "preset",
    presetValues: (viewerRanksService: any) => {
        return viewerRanksService
            .rankLadders
            .flatMap(l => l.ranks.map(r => ({ value: `${l.id}:${r.id}`, display: `${r.name} (${l.name})` })));
    },
    valueIsStillValid: (filterSettings, viewerRanksService: any) => {
        const [ladderId, rankId] = filterSettings.value?.split(":") ?? [];

        const ladder = viewerRanksService.getRankLadder(ladderId);

        const hasRank = ladder?.ranks.some(r => r.id === rankId);

        return hasRank;
    },
    getSelectedValueDisplay: (filterSettings, viewerRanksService: any) => {
        const [ladderId, rankId] = filterSettings.value?.split(":") ?? [];

        const ladder = viewerRanksService.getRankLadder(ladderId);

        const rank = ladder?.ranks.find(r => r.id === rankId);

        if (!ladder || !rank) {
            return "Unknown";
        }

        return `${rank.name} (${ladder.name})`;
    },

    predicate: async (filterSettings, eventData) => {
        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const username = eventMeta.username as string;
        let userId = eventMeta.userId as string;

        if (!username && !userId) {
            return false;
        }

        try {
            if (userId == null) {
                const user = await twitchApi.users.getUserByName(username);

                if (user == null) {
                    return false;
                }

                userId = user.id;
            }

            const [ladderId, rankId] = value?.split(":") ?? [];

            const hasRank = await viewerDatabase.viewerHasRankById(userId, ladderId, rankId);

            switch (comparisonType) {
                case "include":
                    return hasRank;
                case "doesn't include":
                    return !hasRank;
                default:
                    return false;
            }
        } catch {
            // Silently fail
        }

        return false;
    }
};

export default filter;