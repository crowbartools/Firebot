import type { EffectType } from "../../../types/effects";
import { TwitchApi } from "../../streaming-platforms/twitch/api";

const effect: EffectType = {
    definition: {
        id: "firebot:delete-chat-message",
        name: "Delete Chat Message",
        description: "Delete the associated chat message",
        icon: "fad fa-comment-times",
        categories: ["chat based", "advanced", "twitch"],
        dependencies: ["chat"],
        triggers: {
            command: true,
            event: ["twitch:chat-message"]
        }
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect deletes the associated chat message (for a Command or Chat Message Event)</p>
        </eos-container>
    `,
    onTriggerEvent: async ({ trigger }) => {
        let messageId: string = null;
        if (trigger.type === "command") {
            messageId = trigger.metadata.chatMessage.id;
        } else if (trigger.type === "event") {
            // if trigger is event, build chat message from chat event data
            messageId = trigger.metadata.eventData.chatMessage.id;
        }

        if (messageId) {
            await TwitchApi.chat.deleteChatMessage(messageId);
        }

        return true;
    }
};

export = effect;