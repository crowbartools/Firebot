import { EffectType } from "../../../../types/effects";
import { EffectCategory } from "../../../../shared/effect-constants";
import logger from "../../../logwrapper";
import twitchApi from "../../../twitch-api/api";
import frontendCommunicator from "../../../common/frontend-communicator";

const model: EffectType<{
    username: string;
}> = {
    definition: {
        id: "firebot:twitch-shoutout",
        name: "Twitch Shoutout",
        description: "Send a Twitch shoutout to another channel",
        icon: "fad fa-bullhorn",
        categories: [EffectCategory.COMMON, EffectCategory.TWITCH],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-container header="Target">
            <firebot-input model="effect.username" placeholder-text="Enter username" menu-position="below" />
        </eos-container>

        <eos-container>
            <div class="effect-info alert alert-warning">
                Note: You must be live for this effect to work. Per Twitch limits, you may only send a shoutout every two minutes and to the same user once per hour.
            </div>
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];
        const username = effect.username?.trim();

        if (!username?.length) {
            errors.push("You must specify a channel to shoutout");
        }

        return errors;
    },
    optionsController: () => {},
    getDefaultLabel: (effect) => {
        return effect.username;
    },
    onTriggerEvent: async ({ effect }) => {
        const targetUserId = (await twitchApi.users.getUserByName(effect.username))?.id;

        if (targetUserId == null) {
            logger.error(`Unable to shoutout channel. Twitch user ${effect.username} does not exist.`);
            return false;
        }
        const result = await twitchApi.chat.sendShoutout(targetUserId);
        if (!result.success) {
            frontendCommunicator.send("chatUpdate", {
                fbEvent: "ChatAlert",
                message: result.error
            });
        }
        return result.success;
    }
};

module.exports = model;
