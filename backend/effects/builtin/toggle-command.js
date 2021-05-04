"use strict";

const commandAccess = require("../../chat/commands/command-access");
const commandManager = require("../../chat/commands/CommandManager");

const moment = require("moment");
const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const chat = {
    definition: {
        id: "firebot:toggle-command",
        name: "Toggle Command",
        description: "Toggle a command's active status",
        icon: "fad fa-toggle-off",
        categories: [EffectCategory.COMMON],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <p>This effect lets you automatically toggle the active status of Commands.</p>
        </eos-container>

        <eos-container header="Command Type" pad-top="true">
            <dropdown-select options="{ system: 'System', custom: 'Custom'}" selected="effect.commandType"></dropdown-select>
        </eos-container>

        <eos-container ng-show="effect.commandType === 'system'" header="System Commands" pad-top="true">
            <ui-select ng-model="effect.commandId" theme="bootstrap" ng-click="updateSelectedCommand(systemCommands)">
                <ui-select-match placeholder="Select or search for a command... ">{{$select.selected.trigger}}</ui-select-match>
                <ui-select-choices repeat="command.id as command in systemCommands | filter: { trigger: $select.search }" style="position:relative;">
                    <div ng-bind-html="command.trigger | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>
        </eos-container>

        <eos-container ng-show="effect.commandType === 'custom'" header="Custom Commands" pad-top="true">
            <ui-select ng-model="effect.commandId" theme="bootstrap" ng-click="updateSelectedCommand(customCommands)">
                <ui-select-match placeholder="Select or search for a command... ">{{$select.selected.trigger}}</ui-select-match>
                <ui-select-choices repeat="command.id as command in customCommands | filter: { trigger: $select.search }" style="position:relative;">
                    <div ng-bind-html="command.trigger | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>
        </eos-container>

        <eos-container header="Toggle Action" pad-top="true">
            <dropdown-select options="toggleOptions" selected="effect.toggleType"></dropdown-select>
        </eos-container>
    `,
    optionsController: ($scope, commandsService) => {
        $scope.systemCommands = commandsService.getSystemCommands();
        $scope.customCommands = commandsService.getCustomCommands();

        $scope.updateSelectedCommand = commands => {
            if ($scope.effect.commandId) {
                for (const command of commands) {
                    if (command.id === $scope.effect.commandId) {
                        $scope.effect.command = command;
                    }
                }
            }
        };

        $scope.toggleOptions = {
            disable: "Deactivate",
            enable: "Activate"
        };

        if ($scope.effect.toggleType == null) {
            $scope.effect.toggleType = "disable";
        }
    },
    optionsValidator: effect => {
        let errors = [];
        if (effect.commandId == null) {
            errors.push("Please select a command.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        const { effect } = event;
        let command = effect.command;
        command.active = effect.toggleType === "enable";

        if (command.id == null || command.id === "") return;

        if (command.type === "system") {
            commandManager.saveSystemCommandOverride(command);
        }

        if (command.type === "custom") {
            command.lastEditAt = moment().format();

            commandManager.saveCustomCommand(command, event.trigger.metadata.username, false);
        }

        commandAccess.triggerUiRefresh();

        return true;
    }
};

module.exports = chat;
