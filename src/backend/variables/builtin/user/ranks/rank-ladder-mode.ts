import type { ReplaceVariable } from "../../../../../types/variables";
import viewerRankManager from "../../../../ranks/rank-manager";
import logger from "../../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "rankLadderMode",
        usage: "rankLadderMode[rankLadderName]",
        description: "Returns the mode of the specified rank ladder (e.g. 'auto' or 'manual')",
        categories: ["common", "user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger, rankLadderName: string): string => {
        if (!rankLadderName?.length) {
            logger.debug(`$rankLadderMode: rank ladder name provided`);
            return null;
        }

        const ladders = viewerRankManager.getRankLadderHelpers();

        const ladder = ladders.find(ladder => ladder.name === rankLadderName);

        if (!ladder) {
            logger.debug(`$rankLadderMode: Rank ladder ${rankLadderName} not found`);
            return null;
        }

        return ladder.mode;
    }
};

export default model;