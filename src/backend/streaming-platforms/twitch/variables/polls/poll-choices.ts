import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import logger from "../../../../logwrapper";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:channel-poll-begin",
    "twitch:channel-poll-end",
    "twitch:channel-poll-progress"
];
triggers[EffectTrigger.MANUAL] = true;

// From ../../../../events/twitch-events/poll.ts mapChoices(...)
type PollChoice = {
    channelPointsVotes?: number,
    id: string,
    title: string,
    totalVotes?: number
}

const model: ReplaceVariable = {
    definition: {
        handle: "pollChoices",
        description: 'Returns an array of objects representing the choices in the poll that triggered the event, or an empty array if the trigger lacks poll info. Properties will include `index` and `title`, and *may* include `points` and `votes`.',
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.ARRAY, OutputDataType.NUMBER, OutputDataType.OBJECT, OutputDataType.TEXT],
        examples: [
            {
                usage: "pollChoices[count]",
                description: "Gets the number of poll choices that are/were available to chose from, or `-1` if no polling information was provided in the trigger."
            },
            {
                usage: "pollChoices[title, votes]",
                description: 'Gets an array of titles for the poll choices ordered from most-voted to least-voted, or "Unknown" if the trigger lacks polling information.'
            },
            {
                usage: "pollChoices[votes, index, 1]",
                description: "Gets the total number of votes cast for the first option listed, or `-1` if the trigger lacks voting information such as with a Poll Started trigger."
            },
            {
                usage: "pollChoices[points, null, 4]",
                description: "Gets the number of channel point votes that were cast for option 4, or `-1` if the trigger lacks points info or has fewer than four choices available."
            },
            {
                usage: "pollChoices[index, votes, null]",
                description: "Gets an array of choice indices ordered from most-voted to least-voted, or `null` if the trigger lacks polling information."
            },
            {
                usage: "pollChoices[raw, index, 2]",
                description: "Gets an object representing the second poll choice presented, or `null` if the trigger lacks polling information."
            }
        ]
    },
    evaluator: (trigger, ...args: unknown[]) => {
        let propertySelector = "raw";
        let desiredIndex = 0;
        const pollChoices = (trigger.metadata?.eventData?.choices as PollChoice[] ?? []).map((choice, index) => {
            return {
                id: choice.id,
                index: index + 1,
                title: choice.title,
                points: choice.channelPointsVotes,
                votes: choice.totalVotes
            };
        });

        if (!args || args.length === 0) {
            return pollChoices;
        }

        // Handle the property selector parameter first. Immediately handle "count", or error out if invalid.
        if (args.length >= 1 && args[0] && `${args[0]}`.toLowerCase() !== "null") {
            propertySelector = `${args[0]}`.toLowerCase();
            // Short-circuit count here for the sake of simplicity
            if (propertySelector === "count") {
                return pollChoices.length;
            } else if (!(propertySelector === "index" || propertySelector === "points" || propertySelector === "raw" || propertySelector === "title" || propertySelector === "votes")) {
                logger.warn(`$pollChoices invalid property selector received: ${propertySelector}`);
                return null;
            }
        }

        // Next handle the sort parameter in-place. Only "votes" should result in a different sort order.
        if (args.length >= 2 && args[1] && `${args[1]}`.toLowerCase() === "votes") {
            pollChoices.sort((lhs, rhs) => rhs.votes - lhs.votes);
        }

        // Lastly, handle the desired index parameter, and interpret it as a 1-based array index. Immediately error out if invalid.
        if (args.length >= 3 && args[2] && `${args[2]}`.toLowerCase() !== "null") {
            desiredIndex = Number(args[2]);
            if (!Number.isInteger(desiredIndex) || desiredIndex < 0 || desiredIndex > pollChoices.length) {
                logger.warn(`$pollChoices invalid or out-of-range choice index received: ${desiredIndex}`);
                if (propertySelector === "index" || propertySelector === "points" || propertySelector === "votes") {
                    return -1;
                } else if (propertySelector === "title") {
                    return "Unknown";
                }
                // "raw"
                return null;
            }
        }

        switch (propertySelector) {
            case "index":
                if (desiredIndex === 0) {
                    return pollChoices.map(pc => pc.index);
                }
                return pollChoices[desiredIndex - 1].index;
            case "points":
                if (desiredIndex === 0) {
                    return pollChoices.map(pc => pc.points ?? -1);
                }
                return pollChoices[desiredIndex - 1].points ?? -1;
            case "raw":
                if (desiredIndex === 0) {
                    return pollChoices;
                }
                return pollChoices[desiredIndex - 1];
            case "title":
                if (desiredIndex === 0) {
                    return pollChoices.map(pc => pc.title || "Unknown");
                }
                return pollChoices[desiredIndex - 1].title || "Unknown";
            case "votes":
                if (desiredIndex === 0) {
                    return pollChoices.map(pc => pc.votes ?? -1);
                }
                return pollChoices[desiredIndex - 1].votes ?? -1;
            default:
                break;
        }
        logger.error(`$pollChoices invalid property selector unhandled error: ${propertySelector}`);
        return null;
    }
};

export default model;
