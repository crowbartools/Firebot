import type { ReplaceVariable } from "../../../../../types/variables";
import viewerRankManager from "../../../../ranks/rank-manager";
import logger from "../../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "rankValue",
        usage: "rankValue[rankLadderName, rankName]",
        description: "Returns the threshold value of the specified rank in the rank ladder. Only applicable to auto rank ladders.",
        categories: ["common", "user based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger, rankLadderName: string, rankName: string): number => {
        if (!rankLadderName?.length || !rankName?.length) {
            logger.debug(`$rankValue: Invalid rank ladder name or rank name provided`);
            return -1;
        }

        const ladders = viewerRankManager.getRankLadderHelpers();

        const ladder = ladders.find(ladder => ladder.name === rankLadderName);

        if (!ladder) {
            logger.debug(`$rankValue: Rank ladder ${rankLadderName} not found`);
            return -1;
        }

        if (ladder.mode !== "auto") {
            logger.debug(`$rankValue: Rank ladder ${rankLadderName} is not an auto ladder`);
            return -1;
        }

        const rank = ladder.getRankByName(rankName);

        if (!rank) {
            logger.debug(`$rankValue: Rank ${rankName} not found in ladder ${rankLadderName}`);
            return -1;
        }

        return rank.value ?? -1;
    }
};

export default model;