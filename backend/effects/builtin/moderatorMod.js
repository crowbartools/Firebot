"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger, EffectDependency} = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const logger = require('../../logwrapper');
const channelAccess = require("../../common/channel-access");

const model = {
    definition: {
        id: "firebot:modmod",
        name: "Mod",
        description: "Mod or unmod a user",
        icon: "fad fa-crown",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION],
        dependencies: [EffectDependency.CHAT],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
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
        let errors = [];
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
            channelAccess.modUser(event.effect.username);
            logger.debug(event.effect.username + " was modded via the mod effect.");
        }

        if (event.effect.action === "Unmod") {
            channelAccess.unmodUser(event.effect.username);
            logger.debug(event.effect.username + " was modded via the mod effect.");
        }

        return true;
    }
};

module.exports = model;
