import frontendCommunicator from "../common/frontend-communicator";
import JsonDbManager from "../database/json-db-manager.js";
import { RankLadder, Rank } from "../../types/ranks";
import { RankLadderHelper } from "./rank-ladder-helper";

class RankManager extends JsonDbManager<RankLadder> {
    constructor() {
        super("Ranks", "/ranks");
    }

    getRankFromLadder(ladder: RankLadder, rankId: string): Rank | undefined {
        return ladder.ranks.find(rank => rank.id === rankId);
    }

    getRankLadderHelpers(): RankLadderHelper[] {
        return this.getAllItems().map(ladder => new RankLadderHelper(ladder));
    }

    getRankLadderHelper(rankLadderId: string): RankLadderHelper | null {
        const rankLadder = this.getItem(rankLadderId);
        if (!rankLadder) {
            return null;
        }
        return new RankLadderHelper(rankLadder);
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("rank-ladders:updated");
    }
}

const rankManager = new RankManager();

frontendCommunicator.onAsync("rank-ladders:get-all", async () =>
    rankManager.getAllItems()
);

frontendCommunicator.onAsync("rank-ladders:save", async (rankLadder: RankLadder) =>
    rankManager.saveItem(rankLadder)
);

frontendCommunicator.onAsync(
    "rank-ladders:save-all",
    async (rankLadders: RankLadder[]) => rankManager.saveAllItems(rankLadders)
);

frontendCommunicator.on("rank-ladders:delete", (rankLadderId: string) =>
    rankManager.deleteItem(rankLadderId)
);

export = rankManager;
