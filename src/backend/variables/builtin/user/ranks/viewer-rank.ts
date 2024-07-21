import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import viewerRankManager from "../../../../ranks/rank-manager";
import viewerDatabase from "../../../../viewers/viewer-database";
import logger from "../../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "viewerRank",
        usage: "viewerRank[username, rankLadderName]",
        description: "Returns the viewers current rank name for the specified rank ladder",
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, username: null | string, rankLadderName: string) : Promise<string | null> => {
        if (!username?.length || !rankLadderName?.length) {
            logger.debug(`$viewerRank: Invalid username or rank ladder name provided`);
            return null;
        }

        const viewer = await viewerDatabase.getViewerByUsername(username);

        if (!viewer) {
            logger.debug(`$viewerRank: User ${username} not found in the database`);
            return null;
        }

        const ladders = viewerRankManager.getRankLadderHelpers();

        const ladder = ladders.find(ladder => ladder.name === rankLadderName);

        if (!ladder) {
            logger.debug(`$viewerRank: Rank ladder ${rankLadderName} not found`);
            return null;
        }

        const currentRankId = viewer.ranks?.[ladder.id] ?? null;

        if (!currentRankId) {
            logger.debug(`$viewerRank: User ${username} has no rank in ladder ${rankLadderName}`);
            return null;
        }

        return ladder.getRank(currentRankId)?.name ?? null;
    }
};

export default model;