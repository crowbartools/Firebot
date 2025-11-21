import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:channel-poll-begin",
    "twitch:channel-poll-progress",
    "twitch:channel-poll-end"
];
triggers["manual"] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "pollTitle",
        description: 'The title of the Twitch poll that triggered the event, or "Unknown" if no poll information is available',
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata?.eventData?.title ?? "Unknown";
    }
};

export default model;
