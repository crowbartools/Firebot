import frontendCommunicator from "../common/frontend-communicator";
import JsonDbManager from "../database/json-db-manager.js";

export type Rank = {
    id: string;
    name: string;
    value?: number;
};

export type RankTrack = {
    id: string;
    name: string;
    type: "manual" | "auto";
    settings: {
        announcePromotionsInChat?: boolean;
    };
    ranks: Rank[];
};

class RankManager extends JsonDbManager<RankTrack> {
    constructor() {
        super("Ranks", "/ranks");
    }
}

const rankManager = new RankManager();

frontendCommunicator.onAsync("getRankTracks", async () =>
    rankManager.getAllItems()
);

frontendCommunicator.onAsync("saveRankTrack", async (rankTrack: RankTrack) =>
    rankManager.saveItem(rankTrack)
);

frontendCommunicator.onAsync(
    "saveAllRankTrack",
    async (rankTracks: RankTrack[]) => rankManager.saveAllItems(rankTracks)
);

frontendCommunicator.on("deleteRankTrack", (rankTrackId: string) =>
    rankManager.deleteItem(rankTrackId)
);

module.exports = rankManager;
