import { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:channel-goal-begin",
    "twitch:channel-goal-progress",
    "twitch:channel-goal-end"
];
triggers["manual"] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "channelGoalType",
        description: "The type of channel goal that triggered the event.",
        categories: ["text"],
        possibleDataOutput: ["text"],
        triggers: triggers
    },
    evaluator: async (trigger) => {
        return trigger.metadata?.eventData?.friendlyType ?? "No active goal";
    }
};

export default model;