"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');
const logger = require('../../logwrapper');
const twitchChat = require("../../chat/twitch-chat");

const model = {
    definition: {
        id: "firebot:modban",
        name: "Ban",
        description: "Ban or unban a user.",
        icon: "fad fa-ban",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION],
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
        let errors = [];
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
            twitchChat.ban(event.effect.username, "Banned by Firebot");
            logger.debug(event.effect.username + " was banned via the ban effect.");
        }
        if (event.effect.action === "Unban") {
            twitchChat.unban(event.effect.username);
            logger.debug(event.effect.username + " was unbanned via the ban effect.");
        }
        return true;
    }
};

module.exports = model;
