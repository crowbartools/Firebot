import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model: ReplaceVariable = {
    definition: {
        handle: "twitchChannelUrl",
        usage: "twitchChannelUrl[channelName]",
        description: "Returns the Twitch URL for the given channel name (e.g. https://www.twitch.tv/reallycoolfirebotuser).",
        examples: [
            {
                usage: "twitchChannelUrl[$streamer]",
                description: "Returns the Twitch URL for the given channel name (e.g. https://www.twitch.tv/reallycoolfirebotuser)."
            },
            {
                usage: "twitchChannelUrl[$username]",
                description: "Returns the Twitch URL for the given channel name (e.g. https://www.twitch.tv/reallycoolfirebotuser)."
            },
            {
                usage: "twitchChannelUrl[$target]",
                description: "Returns the Twitch URL for the given channel name (e.g. https://www.twitch.tv/reallycoolfirebotuser).(Not all Display Names will work)"
            }
        ],
        categories: [VariableCategory.TEXT, VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger, channelName: string) => {

        return `https://www.twitch.tv/${channelName}`;
    }
};

export default model;