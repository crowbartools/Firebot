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
        <eos-container header="Selection Type" ng-init="showSubcommands = effect.subcommandId != null">
            <div ng-if="sortTags && sortTags.length">
                <label class="control-fb control--radio">Single Command
                    <input type="radio" ng-model="effect.selectionType" value="command" ng-change="typeSelected()" />
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Commands With Tag
                    <input type="radio" ng-model="effect.selectionType" value="sortTag" ng-change="typeSelected()" />
                    <div class="control__indicator"></div>
                </label>
            </div>

            <div ng-if="effect.selectionType && effect.selectionType === 'command'">
                <firebot-searchable-select
                    ng-model="effect.commandId"
                    placeholder="Select or search for a command..."
                    items="commands"
                    item-name="trigger"
                    on-select="commandSelected(item)"
                />
            </div>

            <div ng-if="effect.selectionType && effect.selectionType === 'sortTag'">
                <firebot-searchable-select
                    ng-model="effect.sortTagId"
                    placeholder="Select or search for a tag..."
                    items="sortTags"
                />
            </div>

            <div ng-show="subcommands && !!subcommands.length" class="mt-4 pl-4">
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

        <eos-container header="Action" pad-top="true" ng-show="effect.commandId != null || effect.sortTagId != null">
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
            <div class="mt-2">
                <label class="control-fb control--checkbox"> Global Cooldown
                    <input type="checkbox" ng-init="showGlobal = (effect.globalCooldownSecs != null && effect.globalCooldownSecs !== '')" ng-model="showGlobal"  ng-click="effect.globalCooldownSecs = undefined">
                    <div class="control__indicator"></div>
                </label>
                <div uib-collapse="!showGlobal" class="mb-6 ml-6">
                    <div class="input-group">
                        <span class="input-group-addon" id="globalsecs">Secs</span>
                        <input type="text" class="form-control" aria-describedby="globalsecs" replace-variables="number" ng-model="effect.globalCooldownSecs" placeholder="Enter secs">
                    </div>
                </div>
            </div>
            <div class="mt-2">
                <label class="control-fb control--checkbox"> User Cooldown
                    <input type="checkbox" ng-init="showUser = (effect.userCooldownSecs != null && effect.userCooldownSecs !== '' && effect.username != null && effect.username !== '')" ng-model="showUser" ng-click="effect.userCooldownSecs = undefined; effect.username = undefined;">
                    <div class="control__indicator"></div>
                </label>
                <div uib-collapse="!showUser" class="mb-6 ml-6">
                    <div class="input-group">
                        <span class="input-group-addon" id="username">Username</span>
                        <input type="text" class="form-control" aria-describedby="username" replace-variables ng-model="effect.username" placeholder="Enter name">
                    </div>
                    <div class="muted ml-1 mt-px text-lg">Tip: Use <b>$user</b> to apply the cooldown to the associated user</div>
                    <div class="input-group mt-6">
                        <span class="input-group-addon" id="usersecs">Secs</span>
                        <input type="text" class="form-control" aria-describedby="usersecs" replace-variables="number" ng-model="effect.userCooldownSecs" placeholder="Enter secs">
                    </div>
                </div>
            </div>
        </eos-container>
        <eos-container header="Cooldowns" pad-top="true" ng-show="effect.action === 'Clear'">
            <div class="mt-2">
                <label class="control-fb control--checkbox"> Clear Global Cooldown
                    <input type="checkbox" ng-model="effect.clearGlobalCooldown">
                    <div class="control__indicator"></div>
                </label>
            </div>
            <div class="mt-2">
                <label class="control-fb control--checkbox"> Clear User Cooldown
                    <input type="checkbox" ng-model="effect.clearUserCooldown">
                    <div class="control__indicator"></div>
                </label>
                <div uib-collapse="!effect.clearUserCooldown" class="mb-6 ml-6">
                    <div class="input-group">
                        <span class="input-group-addon" id="username">Username</span>
                        <input type="text" class="form-control" aria-describedby="username" replace-variables ng-model="effect.clearUsername" placeholder="Enter name">
                    </div>
                </div>
            </div>
        </eos-container>
    `,
    optionsController: ($scope, commandsService, sortTagsService) => {
        $scope.commands = commandsService.getCustomCommands();
        $scope.sortTags = sortTagsService.getSortTags('commands');

        $scope.subcommands = [];
        $scope.subcommandOptions = {};

        if ($scope.effect.selectionType == null) {
            if ($scope.effect.commandId != null && $scope.effect.sortTagId == null) {
                $scope.effect.selectionType = 'command';
            }

            if ($scope.commands != null) {
                $scope.effect.selectionType = 'command';
            }
        }

        $scope.createSubcommandOptions = () => {
            const options = {};
            if ($scope.subcommands) {
                $scope.subcommands.forEach((sc) => {
                    options[sc.id] = sc.regex || sc.fallback ? (sc.usage || (sc.fallback ? "Fallback" : "")).split(" ")[0] : sc.arg;
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

            if (command.fallbackSubcommand) {
                $scope.subcommands.push(command.fallbackSubcommand);
            }

            $scope.createSubcommandOptions();
        };

        $scope.typeSelected = () => {
            if ($scope.effect.selectionType === "sortTag") {
                $scope.effect.commandId = null;
                $scope.showSubcommands = false;
                $scope.subcommands = [];
                $scope.effect.subcommandId = null;
            } else {
                $scope.effect.sortTagId = null;
            }
        };

        $scope.commandSelected = (command) => {
            $scope.effect.commandId = command.id;
            $scope.getSubcommands();
        };
        $scope.getSubcommands();
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.commandId == null && effect.sortTagId == null) {
            errors.push("Please select a command or tag");
        }
        if (effect.userCooldownSecs != null && (effect.username == null || effect.username === '')) {
            errors.push("Please provide a username for the user cooldown");
        }
        if (effect.clearUserCooldown != null && (effect.clearUsername == null || effect.clearUsername === '')) {
            errors.push("Please provide a username for clearing user cooldown.");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;
        const commandIds = [];

        if (effect.commandId == null && effect.sortTagId == null) {
            return false;
        }

        if (effect.commandId != null && (effect.selectionType == null || effect.selectionType === "command")) {
            commandIds.push(effect.commandId);
        }

        if (effect.sortTagId != null && effect.selectionType === "sortTag") {
            const commandManager = require("../../chat/commands/command-manager");
            const commands = commandManager.getAllCustomCommands().filter(c => c.sortTags?.includes(effect.sortTagId));
            commands.forEach(c => commandIds.push(c.id));
        }

        const commandCooldownManager = require("../../chat/commands/command-cooldown-manager");
        commandIds.forEach((id) => {
            if (effect.action === "Add") {
                commandCooldownManager.manuallyCooldownCommand({
                    commandId: id,
                    subcommandId: effect.subcommandId,
                    username: effect.username,
                    cooldown: {
                        global: !isNaN(effect.globalCooldownSecs) ? parseInt(effect.globalCooldownSecs) : undefined,
                        user: !isNaN(effect.userCooldownSecs) && effect.username != null && effect.username !== '' ? parseInt(effect.userCooldownSecs) : undefined
                    }
                });
            } else if (effect.action === "Clear") {
                commandCooldownManager.manuallyClearCooldownCommand({
                    commandId: id,
                    subcommandId: effect.subcommandId,
                    username: effect.clearUsername,
                    cooldown: {
                        global: effect.clearGlobalCooldown,
                        user: effect.clearUserCooldown
                    }
                });
            }
        });

        return true;
    }
};

module.exports = model;
