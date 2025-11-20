import type { EffectType } from "../../../types/effects";
import { TwitchApi } from "../../streaming-platforms/twitch/api";
import logger from '../../logwrapper';

const effect: EffectType<{
    action: "Ban" | "Unban";
    username: string;
    reason: string;
}> = {
    definition: {
        id: "firebot:modban",
        name: "Ban",
        description: "Ban or unban a user.",
        icon: "fad fa-ban",
        categories: ["common", "moderation", "twitch"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Action" pad-top="true">
            <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="list-effect-type">{{effect.action ? effect.action : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu celebrate-effect-dropdown">
                    <li ng-click="effect.action = 'Ban'">
                        <a href>Ban</a>
                    </li>
                    <li ng-click="effect.action = 'Unban'">
                        <a href>Unban</a>
                    </li>
                </ul>
            </div>
        </eos-container>

        <eos-container header="Target" pad-top="true" ng-show="effect.action != null">
            <div class="input-group">
                <span class="input-group-addon" id="username-type">Username</span>
                <input ng-model="effect.username" type="text" class="form-control" id="list-username-setting" aria-describedby="list-username-type" replace-variables>
            </div>
        </eos-container>

        <eos-container header="Reason" pad-top="true" ng-show="effect.action === 'Ban'">
            <firebot-input
                input-title="Reason"
                placeholder-text="Banned by Firebot"
                model="effect.reason"
            />
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.action == null) {
            errors.push("Please choose a ban action.");
        }
        if (effect.username == null && effect.username !== "") {
            errors.push("Please put in a username.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        if (effect.action === "Ban") {
            const user = await TwitchApi.users.getUserByName(effect.username);

            if (user != null) {
                const reason = effect.reason?.length ? effect.reason : "Banned by Firebot";
                const result = await TwitchApi.moderation.banUser(user.id, reason);

                if (result === true) {
                    logger.debug(`${effect.username} was banned via the Ban effect.`);
                } else {
                    logger.error(`${effect.username} was unable to be banned via the Ban effect.`);
                    return false;
                }
            } else {
                logger.error(`User ${effect.username} does not exist and could not be banned via the Ban effect`);
                return false;
            }
        }
        if (effect.action === "Unban") {
            const user = await TwitchApi.users.getUserByName(effect.username);

            if (user != null) {
                const result = await TwitchApi.moderation.unbanUser(user.id);

                if (result === true) {
                    logger.debug(`${effect.username} was unbanned via the Ban effect.`);
                } else {
                    logger.error(`${effect.username} was unable to be unbanned via the Ban effect.`);
                    return false;
                }
            } else {
                logger.warn(`User ${effect.username} does not exist and could not be unbanned via the Ban effect`);
                return false;
            }
        }
        return true;
    }
};

export = effect;