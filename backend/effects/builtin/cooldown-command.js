"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const model = {
    definition: {
        id: "firebot:cooldown-command",
        name: "Cooldown Command",
        description: "Manually cooldown a command",
        icon: "fad fa-hourglass-half",
        categories: [EffectCategory.COMMON, EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Command To Cooldown">
            <ui-select ng-model="effect.commandId" theme="bootstrap">
                <ui-select-match placeholder="Select or search for a command... ">{{$select.selected.trigger}}</ui-select-match>
                <ui-select-choices repeat="command.id as command in commands | filter: { trigger: $select.search }" style="position:relative;">
                    <div ng-bind-html="command.trigger | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>
        </eos-container>
        <eos-container header="Cooldowns" pad-top="true" ng-show="effect.commandId != null">
            <div style="margin-top:5px;">
                <label class="control-fb control--checkbox"> Global Cooldown
                    <input type="checkbox" ng-init="showGlobal = (effect.globalCooldownSecs != null && effect.globalCooldownSecs !== '')" ng-model="showGlobal"  ng-click="effect.globalCooldownSecs = undefined">
                    <div class="control__indicator"></div>
                </label>
                <div uib-collapse="!showGlobal" style="margin: 0 0 15px 15px;">
                    <div class="input-group">
                        <span class="input-group-addon" id="globalsecs">Secs</span>
                        <input type="text" class="form-control" aria-describedby="globalsecs" replace-variables="number" ng-model="effect.globalCooldownSecs" placeholder="Enter secs">
                    </div>
                </div>         
            </div>
            <div style="margin-top:5px;">
                <label class="control-fb control--checkbox"> User Cooldown
                    <input type="checkbox" ng-init="showUser = (effect.userCooldownSecs != null && effect.userCooldownSecs !== '' && effect.username != null && effect.username !== '')" ng-model="showUser"  ng-click="effect.userCooldownSecs = undefined; effect.username = undefined;">
                    <div class="control__indicator"></div>
                </label>
                <div uib-collapse="!showUser" style="margin: 0 0 15px 15px;">
                    <div class="input-group">
                        <span class="input-group-addon" id="username">Username</span>
                        <input type="text" class="form-control" aria-describedby="username" replace-variables ng-model="effect.username" placeholder="Enter name">
                    </div>
                    <div class="muted" style="font-size: 11px; margin-left: 3px; margin-top: 1px;">Tip: Use <b>$user</b> to apply the cooldown to the associated user</div>
                    <div class="input-group" style="margin-top: 15px;">
                        <span class="input-group-addon" id="usersecs">Secs</span>
                        <input type="text" class="form-control" aria-describedby="usersecs" replace-variables="number" ng-model="effect.userCooldownSecs" placeholder="Enter secs">
                    </div>
                </div>         
            </div> 
        </eos-container>
    `,
    optionsController: ($scope, commandsService) => {
        $scope.commands = commandsService.getCustomCommands();
    },
    optionsValidator: effect => {
        let errors = [];
        if (effect.commandId == null) {
            errors.push("Please select a command");
        }
        if (effect.userCooldownSecs != null && (effect.username == null || effect.username === '')) {
            errors.push("Please provide a username for the user cooldown");
        }
        return errors;
    },
    onTriggerEvent: event => {
        return new Promise(resolve => {
            let { effect } = event;

            const commandHandler = require("../../chat/commands/commandHandler");
            commandHandler.manuallyCooldownCommand({
                commandId: effect.commandId,
                username: effect.username,
                cooldowns: {
                    global: !isNaN(effect.globalCooldownSecs) ? parseInt(effect.globalCooldownSecs) : undefined,
                    user: !isNaN(effect.userCooldownSecs) && effect.username != null && effect.username !== '' ? parseInt(effect.userCooldownSecs) : undefined
                }
            });

            resolve(true);
        });
    }
};

module.exports = model;
