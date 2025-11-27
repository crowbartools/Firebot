import type { ReplaceVariable } from "../../../../../types/variables";
import { TwitchGoalTypes } from "../../../../../types/goals";
import { TwitchApi } from "../../api";
import logger from "../../../../logwrapper";

const model: ReplaceVariable = {
    definition: {
        handle: "channelGoalDescription",
        description: "The description of the current channel goal.",
        examples: [
            {
                usage: "channelGoalDescription",
                description: "Gets the description for the most recently created active channel goal, or the channel goal that triggered the event."
            },
            {
                usage: "channelGoalDescription[type]",
                description: "Gets the description for the active channel goal of this specific type. Types are `follow`, `sub`, `subpoint`, `newsub`, or `newsubpoint`."
            }
        ],
        categories: ["text"],
        possibleDataOutput: ["text"]
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
                return goalOfType.description;
            }
        }

        // Then check for event data
        if (trigger.metadata?.eventData?.description != null) {
            return trigger.metadata.eventData.description;
        }

        // If neither of those, just grab the first available one
        return goals[0]?.description ?? "No active goal";
    }
};

export default model;