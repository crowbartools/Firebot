import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:channel-poll-progress",
    "twitch:channel-poll-end"
];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "pollWinningChoiceName",
        description: "The name of the winning Twitch poll choice. If there is more than one, this will return a comma separated list (e.g. \"Option 1, Option 2, Option 3\")",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata?.eventData?.winningChoiceName ?? "Unknown";
    }
};

export default model;
