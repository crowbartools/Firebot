"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');

const model = {
    definition: {
        id: "firebot:cooldown-command",
        name: "Cooldown Command",
        description: "Manually add or remove a cooldown for a command",
        icon: "fad fa-hourglass-half",
        categories: [EffectCategory.COMMON, EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Command To Cooldown" ng-init="showSubcommands = effect.subcommandId != null">
            <ui-select ng-model="effect.commandId" theme="bootstrap" on-select="commandSelected($item, $model)">
                <ui-select-match placeholder="Select or search for a command... ">{{$select.selected.trigger}}</ui-select-match>
                <ui-select-choices repeat="command.id as command in commands | filter: { trigger: $select.search }" style="position:relative;">
                    <div ng-bind-html="command.trigger | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>

            <div style="margin-top: 10px; padding-left: 10px;" ng-show="subcommands && !!subcommands.length">
                <label class="control-fb control--radio">Cooldown base command
                    <input type="radio" ng-model="showSubcommands" ng-value="false" ng-click="effect.subcommandId = null"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio" >Cooldown subcommand
                    <input type="radio" ng-model="showSubcommands" ng-value="true"/>
                    <div class="control__indicator"></div>
                </label>

                <div ng-show="showSubcommands">
                    <dropdown-select selected="effect.subcommandId" options="subcommandOptions" placeholder="Please select"></dropdown-select>
                </div>
            </div>

        </eos-container>
        <eos-container header="Action" pad-top="true" ng-show="effect.commandId != null">
            <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="list-effect-type">{{effect.action ? effect.action : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu cooldown-effect-dropdown">
                    <li ng-click="effect.action = 'Add'">
                        <a href>Add</a>
                    </li>
                    <li ng-click="effect.action = 'Clear'">
                        <a href>Clear</a>
                    </li>
                </ul>
            </div>
        </eos-container>
        <eos-container header="Cooldowns" pad-top="true" ng-show="effect.action === 'Add'">
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
        <eos-container header="Cooldowns" pad-top="true" ng-show="effect.action === 'Clear'">
            <div style="margin-top:5px;">
                <label class="control-fb control--checkbox"> Clear Global Cooldown
                    <input type="checkbox" ng-model="effect.clearGlobalCooldown">
                    <div class="control__indicator"></div>
                </label>
            </div>
            <div style="margin-top:5px;">
                <label class="control-fb control--checkbox"> Clear User Cooldown
                    <input type="checkbox" ng-model="effect.clearUserCooldown">
                    <div class="control__indicator"></div>
                </label>
                <div uib-collapse="!effect.clearUserCooldown" style="margin: 0 0 15px 15px;">
                    <div class="input-group">
                        <span class="input-group-addon" id="username">Username</span>
                        <input type="text" class="form-control" aria-describedby="username" replace-variables ng-model="effect.clearUsername" placeholder="Enter name">
                    </div>
                </div>
            </div>
        </eos-container>
    `,
    optionsController: ($scope, commandsService) => {
        $scope.commands = commandsService.getCustomCommands();

        $scope.subcommands = [];

        $scope.subcommandOptions = {};

        $scope.createSubcommandOptions = () => {
            let options = {};
            if ($scope.subcommands) {
                $scope.subcommands.forEach(sc => {
                    options[sc.id] = sc.regex || sc.fallback ? (sc.usage || "").split(" ")[0] : sc.arg;
                });
            }
            $scope.subcommandOptions = options;
        };

        $scope.getSubcommands = () => {
            $scope.subcommands = [];
            const commandId = $scope.effect.commandId;
            if (commandId == null) {
                return;
            }
            const command = $scope.commands.find(c => c.id === commandId);
            if (command == null) {
                return;
            }
            if (command.subCommands) {
                $scope.subcommands = command.subCommands;
            }
            $scope.createSubcommandOptions();
        };
        $scope.commandSelected = (command) => {
            $scope.effect.commandId = command.id;
            $scope.getSubcommands();
        };
        $scope.getSubcommands();
    },
    optionsValidator: effect => {
        let errors = [];
        if (effect.commandId == null) {
            errors.push("Please select a command");
        }
        if (effect.userCooldownSecs != null && (effect.username == null || effect.username === '')) {
            errors.push("Please provide a username for the user cooldown");
        }
        if (effect.clearUserCooldown != null && (effect.clearUsername == null || effect.clearUsername === '')) {
            errors.push("Please provide a username for clearing user cooldown.");
        }
        return errors;
    },
    onTriggerEvent: event => {
        return new Promise(resolve => {
            let { effect } = event;

            const commandHandler = require("../../chat/commands/commandHandler");

            if (effect.action === "Add") {
                commandHandler.manuallyCooldownCommand({
                    commandId: effect.commandId,
                    subcommandId: effect.subcommandId,
                    username: effect.username,
                    cooldowns: {
                        global: !isNaN(effect.globalCooldownSecs) ? parseInt(effect.globalCooldownSecs) : undefined,
                        user: !isNaN(effect.userCooldownSecs) && effect.username != null && effect.username !== '' ? parseInt(effect.userCooldownSecs) : undefined
                    }
                });
            } else if (effect.action === "Clear") {
                commandHandler.manuallyClearCooldownCommand({
                    commandId: effect.commandId,
                    subcommandId: effect.subcommandId,
                    username: effect.clearUsername,
                    cooldowns: {
                        global: effect.clearGlobalCooldown,
                        user: effect.clearUserCooldown
                    }
                });
            }

            resolve(true);
        });
    }
};

module.exports = model;
