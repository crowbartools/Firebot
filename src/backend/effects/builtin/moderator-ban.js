"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');
const logger = require('../../logwrapper');
const twitchApi = require("../../twitch-api/api");

const model = {
    definition: {
        id: "firebot:modban",
        name: "Ban",
        description: "Ban or unban a user.",
        icon: "fad fa-ban",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION, EffectCategory.TWITCH],
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
    `,
    optionsController: () => {},
    optionsValidator: effect => {
        const errors = [];
        if (effect.action == null) {
            errors.push("Please choose a ban action.");
        }
        if (effect.username == null && effect.username !== "") {
            errors.push("Please put in a username.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        if (event.effect.action === "Ban") {
            const user = await twitchApi.users.getUserByName(event.effect.username);

            if (user != null) {
                const result = await twitchApi.moderation.banUser(user.id, "Banned by Firebot");

                if (result === true) {
                    logger.debug(`${event.effect.username} was banned via the Ban effect.`);
                } else {
                    logger.error(`${event.effect.username} was unable to be banned via the Ban effect.`);
                    return false;
                }
            } else {
                logger.error(`User ${event.effect.username} does not exist and could not be banned via the Ban effect`);
                return false;
            }
        }
        if (event.effect.action === "Unban") {
            const user = await twitchApi.users.getUserByName(event.effect.username);

            if (user != null) {
                const result = await twitchApi.moderation.unbanUser(user.id);

                if (result === true) {
                    logger.debug(`${event.effect.username} was unbanned via the Ban effect.`);
                } else {
                    logger.error(`${event.effect.username} was unable to be unbanned via the Ban effect.`);
                    return false;
                }
            } else {
                logger.warn(`User ${event.effect.username} does not exist and could not be unbanned via the Ban effect`);
                return false;
            }
        }
        return true;
    }
};

module.exports = model;
