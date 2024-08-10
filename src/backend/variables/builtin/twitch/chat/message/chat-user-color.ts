import { ReplaceVariable } from "../../../../../../types/variables";
import { EffectTrigger } from "../../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../../shared/variable-constants";
import accountAccess from "../../../../../common/account-access";
import viewerDatabase from "../../../../../viewers/viewer-database";

const twitchApi = require("../../../../../twitch-api/api");
const DEFAULT_COLOR = "#ffffff";

const model : ReplaceVariable = {
    definition: {
        handle: "chatUserColor",
        description: "Outputs the chatters display color from a command or event.",
        examples: [
            {
                usage: "chatUserColor[$target]",
                description: "When in a command, gets the users color for the target user."
            },
            {
                usage: "chatUserColor[$user]",
                description: "Gets the color for associated user (Ie who triggered command, pressed button, etc)."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, username: string) => {
        try {
            let chatColor:string | undefined;
            if (username != null) {
                const viewer = await viewerDatabase.getViewerByUsername(username);
                if (viewer != null) {
                    chatColor = await twitchApi.chat.getColorForUser(viewer._id);
                }
                return chatColor ?? DEFAULT_COLOR;
            }
            if (trigger.metadata.chatMessage) {
                chatColor = trigger?.metadata?.chatMessage?.color;
            } else if (trigger.type === EffectTrigger.EVENT || trigger.type === EffectTrigger.MANUAL) {
                chatColor = trigger?.metadata?.eventData?.chatMessage?.color;
            }
            if (chatColor == null) {
                const userId = trigger?.metadata?.userId ?? accountAccess.getAccounts().streamer.userId;
                chatColor = await twitchApi.chat.getColorForUser(userId);
            }
            return chatColor ?? DEFAULT_COLOR;
        } catch (error) {
            return DEFAULT_COLOR;
        }
    }
};

export default model;