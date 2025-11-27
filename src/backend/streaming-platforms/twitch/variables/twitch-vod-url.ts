import type { ReplaceVariable } from "../../../../types/variables";
import { TwitchApi } from "../api";

const model : ReplaceVariable = {
    definition: {
        handle: "twitchVodUrl",
        description: "The current Twitch VOD URL",
        examples: [
            {
                usage: "twitchVodUrl[true]",
                description: "The current Twitch VOD URL including the current timestamp"
            }
        ],
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger, includeCurrentTimestamp: boolean | string) => {
        const channelData = await TwitchApi.streams.getStreamersCurrentStream();

        if (channelData == null) {
            return "[Error: Not Live]";
        }

        const vod = await TwitchApi.videos.getVodByStreamId(channelData.id);
        if (vod == null) {
            return "[Error: No VOD Found]";
        }

        if (includeCurrentTimestamp !== true && includeCurrentTimestamp !== 'true') {
            return vod.url;
        }

        const startedDate = channelData.startDate;
        const currentDate = new Date();
        const totalSeconds = Math.floor((currentDate.getTime() - startedDate.getTime()) / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${vod.url}?t=${hours}h${minutes}m${seconds}s`;
    }
};

export default model;