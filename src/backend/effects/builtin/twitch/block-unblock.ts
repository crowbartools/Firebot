import { EffectType } from "../../../../types/effects";
import { EffectCategory } from '../../../../shared/effect-constants';
import logger from '../../../logwrapper';
import twitchApi from "../../../twitch-api/api";

const model: EffectType<{
    action: "Block" | "Unblock";
    username: string;
}> = {
    definition: {
        id: "firebot:block",
        name: "Block User",
        description: "block or unblock a user on Twitch.",
        icon: "fad fa-user-slash",
        categories: [EffectCategory.COMMON, EffectCategory.TWITCH],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Action" pad-top="true">
            <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="list-effect-type">{{effect.action ? effect.action : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu celebrate-effect-dropdown">
                    <li ng-click="effect.action = 'Block'">
                        <a href>Block</a>
                    </li>
                    <li ng-click="effect.action = 'Unblock'">
                        <a href>Unblock</a>
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
    `,
    optionsController: () => {},
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.action == null) {
            errors.push("Please choose a block action.");
        }
        if (effect.username == null && effect.username !== "") {
            errors.push("Please put in a username.");
        }
        return errors;
    },
    getDefaultLabel: (effect) => {
        return `${effect.action} ${effect.username}`;
    },
    onTriggerEvent: async (event) => {
        if (event.effect.action === "Block") {
            const user = await twitchApi.users.getUserByName(event.effect.username);

            if (user != null) {
                const result = await twitchApi.users.blockUser(user.id);

                if (result === true) {
                    logger.debug(`${event.effect.username} was blocked via the Block User effect.`);
                } else {
                    logger.error(`${event.effect.username} was unable to be blocked via the Block User effect.`);
                    return false;
                }
            } else {
                logger.error(`User ${event.effect.username} does not exist and could not be blocked via the Block User effect`);
                return false;
            }
        }
        if (event.effect.action === "Unblock") {
            const user = await twitchApi.users.getUserByName(event.effect.username);

            if (user != null) {
                const result = await twitchApi.users.unblockUser(user.id);

                if (result === true) {
                    logger.debug(`${event.effect.username} was unblocked via the Block User effect.`);
                } else {
                    logger.error(`${event.effect.username} was unable to be unblocked via the Block User effect.`);
                    return false;
                }
            } else {
                logger.warn(`User ${event.effect.username} does not exist and could not be unblocked via the Block User effect`);
                return false;
            }
        }
        return true;
    }
};

module.exports = model;
