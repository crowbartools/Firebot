import type { EffectType } from "../../../types/effects";
import { TwitchApi } from "../../streaming-platforms/twitch/api";
import logger from '../../logwrapper';

const effect: EffectType<{
    username: string;
}> = {
    definition: {
        id: "firebot:modpurge",
        name: "Purge",
        description: "Purge a users chat messages from chat.",
        icon: "fad fa-comment-slash",
        categories: ["common", "moderation", "twitch", "chat based"],
        dependencies: ["chat"]
    },
    optionsTemplate: `
    <eos-container header="Target" pad-top="true">
        <div class="input-group">
            <span class="input-group-addon" id="username-type">Username</span>
            <input ng-model="effect.username" type="text" class="form-control" id="list-username-setting" aria-describedby="list-username-type" replace-variables menu-position="below">
        </div>
    </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.username == null && effect.username !== "") {
            errors.push("Please enter a username.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        const user = await TwitchApi.users.getUserByName(effect.username);

        if (user != null) {
            const result = await TwitchApi.moderation.timeoutUser(user.id, 1, "Chat messages purged via Firebot");

            if (result === true) {
                logger.debug(`${effect.username} was purged via the Purge effect.`);
            } else {
                logger.error(`${effect.username} was unable to be purged via the Purge effect.`);
                return false;
            }
        } else {
            logger.warn(`User ${effect.username} does not exist and could not be purged via the Purge effect.`);
            return false;
        }

        return true;
    }
};

export = effect;