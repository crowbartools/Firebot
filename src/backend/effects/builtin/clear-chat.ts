import { EffectType } from '../../../types/effects';
import { TwitchApi } from "../../streaming-platforms/twitch/api";
import logger from '../../logwrapper';

const effect: EffectType = {
    definition: {
        id: "firebot:clearchat",
        name: "Clear Chat",
        description: "Clear all chat messages.",
        icon: "fad fa-eraser",
        categories: ["common", "moderation", "twitch", "chat based"],
        dependencies: ["chat"]
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect will clear all chat messages from chat, exactly like the Twitch /clear command.</p>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: () => [],
    onTriggerEvent: async () => {
        await TwitchApi.chat.clearChat();
        logger.debug("Chat was cleared via the clear chat effect.");
        return true;
    }
};

export = effect;