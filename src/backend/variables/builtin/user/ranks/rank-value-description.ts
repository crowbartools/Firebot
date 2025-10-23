import type { ReplaceVariable } from "../../../../../types/variables";
import viewerRankManager from "../../../../ranks/rank-manager";
import logger from "../../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "rankValueDescription",
        usage: "rankValueDescription[rankLadderName, rankName]",
        description: "Returns the threshold value description of the specified rank in the rank ladder, i.e. '50 hours'. Only applicable to auto rank ladders.",
        categories: ["common", "user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger, rankLadderName: string, rankName: string): string => {
        if (!rankLadderName?.length || !rankName?.length) {
            logger.debug(`$rankValueDescription: Invalid rank ladder name or rank name provided`);
            return null;
        }

        const ladders = viewerRankManager.getRankLadderHelpers();

        const ladder = ladders.find(ladder => ladder.name === rankLadderName);

        if (!ladder) {
            logger.debug(`$rankValueDescription: Rank ladder ${rankLadderName} not found`);
            return null;
        }

        if (ladder.mode !== "auto") {
            logger.debug(`$rankValueDescription: Rank ladder ${rankLadderName} is not an auto ladder`);
            return null;
        }

        const rank = ladder.getRankByName(rankName);

        if (!rank) {
            logger.debug(`$rankValueDescription: Rank ${rankName} not found in ladder ${rankLadderName}`);
            return null;
        }

        return ladder.getRankValueDescription(rank.id) ?? null;
    }
};

export default model;