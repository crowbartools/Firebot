import { EffectType } from "../../../types/effects";
import { TriggersObject } from '../../../types/triggers';
import frontendCommunicator from "../../common/frontend-communicator";
import logger from "../../logwrapper";

const triggers: TriggersObject = {};
triggers["command"] = true;
triggers["event"] = ["twitch:chat-message"];
triggers["preset"] = true;

const effect: EffectType<{
    hidden: boolean;
}> = {
    definition: {
        id: "firebot:chat-feed-message-hide",
        name: "Hide Message In Chat Feed",
        description: "Hide a message in Firebot's chat feed",
        icon: "fad fa-eye-slash",
        categories: ["common", "dashboard", "chat based"],
        dependencies: ["chat"],
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
    onTriggerEvent: (event) => {
        const { trigger } = event;

        try {
            let messageId = "";
            if (typeof trigger.metadata.chatMessage?.id === "string" && trigger.metadata.chatMessage.id.length > 0) {
                messageId = trigger.metadata.chatMessage.id;
            } else if (typeof trigger.metadata.eventData?.chatMessage?.id === "string" && trigger.metadata.eventData.chatMessage.id.length > 0) {
                messageId = trigger.metadata.eventData.chatMessage.id;
            } else {
                logger.warn("chat-feed-message-hide: No messageId found in trigger. Cannot hide message.");
                return;
            }

            logger.debug("chat-feed-message-hide: Hiding message in chat feed: messageId=", messageId);
            frontendCommunicator.send("chat-feed-message-hide", { messageId: messageId });
        } catch (error) {
            logger.error("chat-feed-message-hide: Error hiding message in chat feed: ", error);
        }
    }
};

export = effect;