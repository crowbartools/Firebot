import { EffectCategory, EffectDependency, EffectTrigger } from '../../../shared/effect-constants';
import { EffectType } from "../../../types/effects";
import frontendCommunicator from "../../common/frontend-communicator";
import logger from "../../logwrapper";

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = ["twitch:chat-message"];

const model: EffectType<{
    hidden: boolean;
}> = {
    definition: {
        id: "firebot:chat-feed-message-hide",
        name: "Hide Message In Chat Feed",
        description: "Hide a message in Firebot's chat feed",
        icon: "fad fa-eye-slash",
        categories: [EffectCategory.COMMON, EffectCategory.CHAT_BASED],
        dependencies: [EffectDependency.CHAT],
        triggers: triggers
    },
    optionsTemplate: `
    <eos-container header="Explanation" pad-top="true">
        <p class="muted">This effect hides a message within the chat feed in the Firebot dashboard.</p>
        <p class="muted">This does <b>not</b> hide or delete the message in your Twitch chat, browser overlays, or any other chat client you may be using.</p>
    </eos-container>
    `,
    optionsController: () => {
        // No options controller needed for this effect
    },
    optionsValidator: () => {
        return [];
    },
    onTriggerEvent: async (event) => {
        const { trigger } = event;

        try {
            let messageId = null;
            if (trigger.type === EffectTrigger.COMMAND) {
                messageId = trigger.metadata.chatMessage.id;
            } else if (trigger.type === EffectTrigger.EVENT) {
                messageId = trigger.metadata.eventData.chatMessage.id;
            }

            if (messageId) {
                logger.debug("chat-feed-message-hide: Hiding message in chat feed: messageId=", messageId);
                frontendCommunicator.send("chat-feed-message-hide", { messageId: messageId });
            } else {
                logger.warn("chat-feed-message-hide: No messageId found in trigger. Cannot hide message.");
            }
        } catch (error) {
            logger.error("chat-feed-message-hide: Error hiding message in chat feed: ", error);
        }
    }
};

export = model;
