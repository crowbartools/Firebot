import type { ReplaceVariable } from "../../../../../types/variables";
import { AccountAccess } from "../../../../common/account-access";
import { TwitchApi } from "../../api";

const model : ReplaceVariable = {
    definition: {
        handle: "categoryImageUrl",
        usage: "categoryImageUrl",
        description: "Gets the url for the image url of your last streamed category.",
        examples: [
            {
                usage: "categoryImageUrl[$target]",
                description: "When in a command, gets the image url of the last streamed category for the target channel."
            },
            {
                usage: "categoryImageUrl[$user]",
                description: "Gets the image url of the last streamed category for associated user (Ie who triggered command, pressed button, etc)."
            },
            {
                usage: "categoryImageUrl[ebiggz]",
                description: "Gets the image url of the last streamed category for a specific channel."
            },
            {
                usage: "categoryImageUrl[ebiggz, 285x380]",
                description: "Get a different image size (use aspect ratio 4:3). Default is 285x380."
            }
        ],
        categories: ["user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (_, username: string, size = "285x380") => {
        if (username == null) {
            username = AccountAccess.getAccounts().streamer.username;
        }

        try {
            const channelInfo = await TwitchApi.channels.getChannelInformationByUsername(username);
            const category = await TwitchApi.categories.getCategoryById(channelInfo.gameId, size as string);

            return category.boxArtUrl ? category.boxArtUrl : "[No Category Image Found]";
        } catch {
            return "[No Category Image Found]";
        }
    }
};

export default model;