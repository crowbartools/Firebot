import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import viewerRankManager from "../../../../ranks/rank-manager";
import viewerDatabase from "../../../../viewers/viewer-database";
import logger from "../../../../logwrapper";
import { FirebotViewer } from "../../../../../types/viewers";

const model : ReplaceVariable = {
    definition: {
        handle: "viewersInRankArray",
        usage: "viewersInRankArray[rankLadderName, rankName]",
        description: "Returns an array of viewer objects in the specified rank. Viewer object properties: _id, username, displayName",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ARRAY]
    },
    evaluator: async (trigger, rankLadderName: string, rankName: string) : Promise<FirebotViewer[]> => {
        if (!rankLadderName?.length || !rankName?.length) {
            logger.debug(`$viewersInRankArray: Invalid rank ladder name or rank name provided`);
            return null;
        }

        const ladders = viewerRankManager.getRankLadderHelpers();

        const ladder = ladders.find(ladder => ladder.name === rankLadderName);

        if (!ladder) {
            logger.debug(`$viewersInRankArray: Rank ladder ${rankLadderName} not found`);
            return null;
        }

        const rank = ladder.getRankByName(rankName);

        if (!rank) {
            logger.debug(`$viewersInRankArray: Rank ${rankName} not found in ladder ${rankLadderName}`);
            return null;
        }

        const viewers = await viewerDatabase.getViewerDb().findAsync({ [`ranks.${ladder.id}`]: rank.id }, { _id: 1, username: 1, displayName: 1 });

        return viewers;
    }
};

export default model;