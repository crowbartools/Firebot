import frontendCommunicator from "../common/frontend-communicator";
import JsonDbManager from "../database/json-db-manager.js";

export type Rank = {
    id: string;
    name: string;
    value?: number;
};

export type RankLadder = {
    id: string;
    name: string;
    type: "manual" | "auto";
    enabled: boolean;
    settings: {
        trackBy?: "view_time" | "currency",
        currencyId?: string;
        announcePromotionsInChat?: boolean;
    };
    ranks: Rank[];
};

class RankManager extends JsonDbManager<RankLadder> {
    constructor() {
        super("Ranks", "/ranks");
    }
}

const rankManager = new RankManager();

frontendCommunicator.onAsync("getRankLadders", async () =>
    rankManager.getAllItems()
);

frontendCommunicator.onAsync("saveRankLadder", async (rankLadder: RankLadder) =>
    rankManager.saveItem(rankLadder)
);

frontendCommunicator.onAsync(
    "saveAllRankLadders",
    async (rankLadders: RankLadder[]) => rankManager.saveAllItems(rankLadders)
);

frontendCommunicator.on("deleteRankLadder", (rankLadderId: string) =>
    rankManager.deleteItem(rankLadderId)
);

module.exports = rankManager;
