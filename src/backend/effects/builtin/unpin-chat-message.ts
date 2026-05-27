import type { EffectType } from "../../../types";
import { TwitchApi } from "../../streaming-platforms/twitch/api";
import logger from "../../logwrapper";

const effect: EffectType = {
    definition: {
        id: "firebot:unpin-chat-message",
        name: "Unpin Chat Message",
        description: "Unpin the currently pinned chat message",
        icon: "fas fa-comment-slash",
        categories: ["chat based", "advanced", "twitch"],
        dependencies: ["chat"]
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect unpins the currently pinned chat message from the top of chat</p>
        </eos-container>
    `,
    onTriggerEvent: async () => {
        const pinnedMessage = await TwitchApi.chat.getPinnedChatMessage();

        if (pinnedMessage?.messageId) {
            await TwitchApi.chat.unpinChatMessage(pinnedMessage.messageId);
        } else {
            logger.warn("No pinned message to unpin");
        }

        return true;
    }
};

export = effect;