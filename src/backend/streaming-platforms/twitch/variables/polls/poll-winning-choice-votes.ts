import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:channel-poll-progress",
    "twitch:channel-poll-end"
];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "pollWinningChoiceVotes",
        description: "The total number of votes the winning Twitch poll choice received.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata?.eventData?.winningChoiceVotes ?? -1;
    }
};

export default model;
