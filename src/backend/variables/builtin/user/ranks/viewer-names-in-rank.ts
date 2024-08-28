import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import viewerRankManager from "../../../../ranks/rank-manager";
import viewerDatabase from "../../../../viewers/viewer-database";
import logger from "../../../../logwrapper";
import { FirebotViewer } from "../../../../../types/viewers";

const model : ReplaceVariable = {
    definition: {
        handle: "viewerNamesInRank",
        usage: "viewerNamesInRank[rankLadderName, rankName]",
        description: "Returns an comma separated list of viewer names in the specified rank",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, rankLadderName: string, rankName: string) : Promise<string> => {
        if (!rankLadderName?.length || !rankName?.length) {
            logger.debug(`$viewerNamesInRank: Invalid rank ladder name or rank name provided`);
            return null;
        }

        const ladders = viewerRankManager.getRankLadderHelpers();

        const ladder = ladders.find(ladder => ladder.name === rankLadderName);

        if (!ladder) {
            logger.debug(`$viewerNamesInRank: Rank ladder ${rankLadderName} not found`);
            return null;
        }

        const rank = ladder.getRankByName(rankName);

        if (!rank) {
            logger.debug(`$viewerNamesInRank: Rank ${rankName} not found in ladder ${rankLadderName}`);
            return null;
        }

        const viewers = await viewerDatabase.getViewerDb().findAsync({ [`ranks.${ladder.id}`]: rank.id }, { _id: 1, username: 1, displayName: 1 });

        return viewers.map(viewer => viewer.displayName).join(", ");
    }
};

export default model;