import type { ReplaceVariable } from "../../../../../types/variables";
import { AccountAccess } from "../../../../common/account-access";
import { TwitchApi } from "../../api";
import logger from "../../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "currentViewerCount",
        description: "Get the number of people viewing your stream.",
        categories: ["numbers"],
        possibleDataOutput: ["number"]
    },
    evaluator: async () => {
        logger.debug("Getting number of viewers in chat for variable.");

        // get streamer user id
        const streamerId = AccountAccess.getAccounts().streamer.userId;

        // retrieve stream data for user id
        const twitchClient = TwitchApi.streamerClient;
        const streamInfo = await twitchClient.streams.getStreamByUserId(streamerId);

        // extract viewer count
        return streamInfo ? streamInfo.viewers : 0;
    }
};

export default model;
