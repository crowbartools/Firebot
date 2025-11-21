import type { ReplaceVariable } from "../../../../types/variables";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";

const model : ReplaceVariable = {
    definition: {
        handle: "uptime",
        description: "The current stream uptime",
        possibleDataOutput: ["text"]
    },
    evaluator: async () => {
        return await TwitchApi.streams.getStreamUptime();
    }
};

export default model;