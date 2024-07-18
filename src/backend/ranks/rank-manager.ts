import frontendCommunicator from "../common/frontend-communicator";
import JsonDbManager from "../database/json-db-manager.js";
import { RankLadder, Rank } from "../../types/ranks";

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
