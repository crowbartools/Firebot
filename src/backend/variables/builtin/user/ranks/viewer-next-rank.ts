import type { ReplaceVariable } from "../../../../../types/variables";
import viewerRankManager from "../../../../ranks/rank-manager";
import viewerDatabase from "../../../../viewers/viewer-database";
import logger from "../../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "viewerNextRank",
        usage: "viewerNextRank[username, rankLadderName]",
        description: "Returns the the next rank in specified rank ladder for the user",
        categories: ["common", "user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger, username: null | string, rankLadderName: string) : Promise<string | null> => {
        if (!username?.length || !rankLadderName?.length) {
            logger.debug(`$viewerNextRank: Invalid username or rank ladder name provided`);
            return null;
        }

        const viewer = await viewerDatabase.getViewerByUsername(username);

        if (!viewer) {
            logger.debug(`$viewerNextRank: User ${username} not found in the database`);
            return null;
        }

        const ladders = viewerRankManager.getRankLadderHelpers();

        const ladder = ladders.find(ladder => ladder.name === rankLadderName);

        if (!ladder) {
            logger.debug(`$viewerNextRank: Rank ladder ${rankLadderName} not found`);
            return null;
        }

        const currentRankId = viewer.ranks?.[ladder.id] ?? null;
        const nextRankId = ladder.getNextRankId(currentRankId);

        if (!nextRankId) {
            logger.debug(`$viewerNextRank: User ${username} has no next rank in ladder ${rankLadderName}`);
            return null;
        }

        return ladder.getRank(nextRankId)?.name ?? null;
    }
};

export default model;