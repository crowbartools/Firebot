import { EffectType } from '../../../../types/effects';
import { EffectCategory, EffectDependency } from '../../../../shared/effect-constants';
import logger from '../../../logwrapper';
import twitchApi from "../../../twitch-api/api";
import chatRolesManager from "../../../roles/chat-roles-manager";

const model: EffectType<{
    action: "Add VIP" | "Remove VIP";
    username: string;
}> = {
    definition: {
        id: "firebot:update-vip-role",
        name: "VIP",
        description: "Add or remove the VIP role of a user",
        icon: "far fa-gem",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION, EffectCategory.TWITCH],
        dependencies: [EffectDependency.CHAT]
    },
    optionsTemplate: `
    <eos-container header="Action" pad-top="true">
        <div class="btn-group">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="list-effect-type">{{effect.action ? effect.action : 'Pick one'}}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu celebrate-effect-dropdown">
                <li ng-click="effect.action = 'Add VIP'">
                    <a href>Add VIP</a>
                </li>
                <li ng-click="effect.action = 'Remove VIP'">
                    <a href>Remove VIP</a>
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
            errors.push("Please choose an action.");
        }
        if (effect.username == null && effect.username !== "") {
            errors.push("Please put in a username.");
        }
        return errors;
    },
    getDefaultLabel: (effect) => {
        return `${effect.action} for ${effect.username}`;
    },
    onTriggerEvent: async (event) => {
        if (event.effect.action === "Add VIP") {
            const user = await twitchApi.users.getUserByName(event.effect.username);

            if (user != null) {
                const result = await twitchApi.moderation.addChannelVip(user.id);

                if (result === true) {
                    chatRolesManager.addVipToVipList({
                        id: user.id,
                        username: user.name,
                        displayName: user.displayName
                    });
                    logger.debug(`${event.effect.username} was assigned VIP via the VIP effect.`);
                } else {
                    logger.error(`${event.effect.username} was unable to be assigned VIP via the VIP effect.`);
                }
            } else {
                logger.warn(`User ${event.effect.username} does not exist and could not be assigned VIP via the VIP effect`);
            }
        } else if (event.effect.action === "Remove VIP") {
            const user = await twitchApi.users.getUserByName(event.effect.username);

            if (user != null) {
                const result = await twitchApi.moderation.removeChannelVip(user.id);

                if (result === true) {
                    chatRolesManager.removeVipFromVipList(user.id);
                    logger.debug(`${event.effect.username} was unassigned VIP via the VIP effect.`);
                } else {
                    logger.error(`${event.effect.username} was unable to be unassigned VIP via the VIP effect.`);
                }
            } else {
                logger.warn(`User ${event.effect.username} does not exist and could not be unassigned VIP via the VIP effect`);
            }
        }

        return true;
    }
};

module.exports = model;
