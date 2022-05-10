"use strict";

const { EffectCategory, EffectDependency } = require('../../../shared/effect-constants');
const logger = require('../../logwrapper');
const twitchChat = require("../../chat/twitch-chat");

const model = {
    definition: {
        id: "firebot:modmod",
        name: "Mod",
        description: "Mod or unmod a user",
        icon: "fad fa-crown",
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
                <li ng-click="effect.action = 'Mod'">
                    <a href>Mod</a>
                </li>
                <li ng-click="effect.action = 'Unmod'">
                    <a href>Unmod</a>
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
            errors.push("Please choose an action.");
        }
        if (effect.username == null && effect.username !== "") {
            errors.push("Please put in a username.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        if (event.effect.action === "Mod") {
            await twitchChat.mod(event.effect.username);
            logger.debug(event.effect.username + " was modded via the mod effect.");
        } else if (event.effect.action === "Unmod") {
            await twitchChat.unmod(event.effect.username);
            logger.debug(event.effect.username + " was unmodded via the mod effect.");
        }

        return true;
    }
};

module.exports = model;
