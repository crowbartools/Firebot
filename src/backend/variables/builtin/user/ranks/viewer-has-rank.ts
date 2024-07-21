import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import viewerRankManager from "../../../../ranks/rank-manager";
import viewerDatabase from "../../../../viewers/viewer-database";
import logger from "../../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "viewerHasRank",
        usage: "viewerHasRank[username, rankLadderName, rankName]",
        description: "Whether the viewer has the specified rank in the specified rank ladder",
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.BOOLEAN]
    },
    evaluator: async (trigger, username: string, rankLadderName: string, rankName: string) : Promise<boolean> => {
        if (!username?.length || !rankLadderName?.length || !rankName?.length) {
            logger.debug(`$viewerHasRank: Invalid username, rank ladder name, or rank name provided`);
            return false;
        }

        const viewer = await viewerDatabase.getViewerByUsername(username);

        if (!viewer) {
            logger.debug(`$viewerHasRank: User ${username} not found in the database`);
            return false;
        }

        const ladders = viewerRankManager.getRankLadderHelpers();

        const ladder = ladders.find(ladder => ladder.name === rankLadderName);

        if (!ladder) {
            logger.debug(`$viewerHasRank: Rank ladder ${rankLadderName} not found`);
            return false;
        }

        const rank = ladder.getRankByName(rankName);

        if (!rank) {
            logger.debug(`$viewerHasRank: Rank ${rankName} not found in ladder ${rankLadderName}`);
            return false;
        }

        const viewersCurrentRankId = viewer.ranks?.[ladder.id] ?? null;

        return rank.id === viewersCurrentRankId;
    }
};

export default model;