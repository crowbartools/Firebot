import type { ReplaceVariable } from "../../../../../types/variables";
import { TwitchGoalTypes } from "../../../../../types/goals";
import { TwitchApi } from "../../api";
import logger from "../../../../logwrapper";

const model: ReplaceVariable = {
    definition: {
        handle: "channelGoalCurrentAmount",
        description: "The current amount of the current channel goal.",
        examples: [
            {
                usage: "channelGoalCurrentAmount",
                description: "Gets the current amount for the most recently created active channel goal, or the channel goal that triggered the event."
            },
            {
                usage: "channelGoalCurrentAmount[type]",
                description: "Gets the current amount for the active channel goal of this specific type. Types are `follow`, `sub`, `subpoint`, `newsub`, or `newsubpoint`."
            }
        ],
        categories: ["numbers"],
        possibleDataOutput: ["number"]
    },
    evaluator: async (trigger, type: string) => {
        const goals = await TwitchApi.goals.getCurrentChannelGoals();

        // Check for specific type first
        if (type != null) {
            type = type.toLowerCase();

            if (TwitchGoalTypes[type] == null) {
                logger.warn(`Invalid channel goal type specified: ${type}`);
                return null;
            }

            const goalOfType = goals.find(g => g.type === TwitchGoalTypes[type]);
            if (goalOfType != null) {
                return goalOfType.currentAmount;
            }
        }

        // Then check for event data
        if (trigger.metadata?.eventData?.currentAmount != null) {
            return trigger.metadata.eventData.currentAmount;
        }

        // If neither of those, just grab the first available one
        return goals[0]?.currentAmount ?? "No active goal";
    }
};

export default model;