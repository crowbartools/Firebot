import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";

const model : ReplaceVariable = {
    definition: {
        handle: "uptime",
        description: "The current stream uptime",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {
        return await TwitchApi.streams.getStreamUptime();
    }
};

export default model;