import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model: ReplaceVariable = {
    definition: {
        handle: "twitchChannelUrl",
        usage: "twitchChannelUrl[channel]",
        description: "Returns the Twitch URL for the given channel name (e.g. https://www.twitch.tv/ReallyCoolFirebotUser).",
        categories: [VariableCategory.TEXT, VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger, channelName: string) => {
        return `https://www.twitch.tv/${channelName}`;
    }
};

export default model;