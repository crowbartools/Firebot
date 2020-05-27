"use strict";
const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const logger = require('../../logwrapper');
const channelAccess = require('../../common/channel-access');
const activeChatter = require('../../roles/role-managers/active-chatters');
const activeMixplay = require('../../roles/role-managers/active-mixplay-users');

const model = {
    definition: {
        id: "firebot:activeUserLists",
        name: "Manage Active User Lists",
        description: "Add or remove users from the active user lists.",
        icon: "fad fa-users",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    optionsTemplate: `
    <eos-container header="List Type" pad-top="true">
        <div class="btn-group">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="list-effect-type">{{effect.list ? effect.list : 'Pick one'}}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu celebrate-effect-dropdown">
                <li ng-click="effect.list = 'Active Chatters'">
                    <a href>Active Chatters</a>
                </li>
                <li ng-click="effect.list = 'Active Mixplay Users'">
                    <a href>Active Mixplay Users</a>
                </li>
                <li ng-click="effect.list = 'All'">
                    <a href>All Active User Lists</a>
                </li>
            </ul>
        </div>
    </eos-container>
    <eos-container header="Action" pad-top="true" ng-show="effect.list != null">
        <div class="btn-group">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="list-effect-type">{{effect.action ? effect.action : 'Pick one'}}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu celebrate-effect-dropdown">
                <li ng-click="effect.action = 'Add User'">
                    <a href>Add User</a>
                </li>
                <li ng-click="effect.action = 'Remove User'">
                    <a href>Remove User</a>
                </li>
                <li ng-click="effect.action = 'Clear List'">
                    <a href>Clear List</a>
                </li>
            </ul>
        </div>
    </eos-container>
    <eos-container header="Target" pad-top="true" ng-show="effect.action != null && effect.action !== 'Clear List'">
        <div class="input-group">
            <span class="input-group-addon" id="username-type">Username</span>
            <input ng-model="effect.username" type="text" class="form-control" id="list-username-setting" aria-describedby="list-username-type" replace-variables>
        </div>
    </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: effect => {
        let errors = [];
        if (effect.list == null || effect.list === "") {
            errors.push("Please select a list to manage.");
        }
        if (effect.action == null || effect.action === "") {
            errors.push("Please select an action to perform.");
        }
        if (effect.username == null && effect.action !== "Clear List" || effect.username === "" && effect.action !== "Clear List") {
            errors.push("Please enter a username.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        let username = event.effect.username;
        if (username == null) {
            logger.debug("Couldnt find username for active user list effect.");
            return true;
        }

        let userIds = await channelAccess.getIdsFromUsername(event.effect.username);
        if (userIds == null) {
            logger.debug("Couldnt get ids for username in active user list effect.");
            return true;
        }

        // This is silly, but these expect mixer objects which have different ways of formatting these property names.
        let user = {
            // eslint-disable-next-line camelcase
            user_name: username,
            username: username,
            userID: userIds.userId,
            // eslint-disable-next-line camelcase
            user_id: userIds.userId
        };

        switch (event.effect.list) {
        case "Active Chatters":
            if (event.effect.action === "Add User") {
                await activeChatter.addOrUpdateActiveChatter(user);
            } else if (event.effect.action === "Remove User") {
                await activeChatter.removeUserFromList(user);
            } else if (event.effect.action === "Clear List") {
                await activeChatter.clearList();
            }
            break;
        case "Active Mixplay Users":
            if (event.effect.action === "Add User") {
                await activeMixplay.addOrUpdateActiveUser(user);
            } else if (event.effect.action === "Remove User") {
                await activeMixplay.removeUserFromList(user);
            } else if (event.effect.action === "Clear List") {
                await activeMixplay.clearList();
            }
            break;
        case "All":
            if (event.effect.action === "Add User") {
                await activeMixplay.addOrUpdateActiveUser(user);
                await activeChatter.addOrUpdateActiveChatter(user);
            } else if (event.effect.action === "Remove User") {
                await activeMixplay.removeUserFromList(user);
                await activeChatter.removeUserFromList(user);
            } else if (event.effect.action === "Clear List") {
                await activeMixplay.clearList();
                await activeChatter.clearList();
            }
            break;
        default:
            logger.debug('Incorrect list type passed to active user lists effect.');
        }

        return true;
    }
};

module.exports = model;
