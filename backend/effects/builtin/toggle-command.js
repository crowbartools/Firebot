"use strict";

const commandAccess = require("../../chat/commands/command-access");

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

        <eos-container ng-show="effect.commandType === 'system'" header="System commands" pad-top="true">
            <dropdown-select options="systemCommandOptions" selected="effect.selectedCommandId" on-update="updateCommandSelection(effect.selectedCommandId)"></dropdown-select>
        </eos-container>

        <eos-container ng-show="effect.commandType === 'custom' && hasCustomCommands && hasSortTags" header="Sort Tag" pad-top="true">
            <dropdown-select options="customCommandSortTags" selected="effect.selectedSortTagId" on-update="updateCustomCommandOptions(effect.selectedSortTagId)"></dropdown-select>
        </eos-container>

        <eos-container ng-show="effect.commandType === 'custom' && hasCustomCommands" header="Custom Command" pad-top="true">
            <dropdown-select options="customCommandOptions" selected="effect.selectedCommandId" on-update="updateCommandSelection(effect.selectedCommandId)"></dropdown-select>
        </eos-container>

        <eos-container header="Toggle Action" pad-top="true">
            <dropdown-select options="toggleOptions" selected="effect.toggleType"></dropdown-select>
        </eos-container>
    `,
    optionsController: ($scope, commandsService) => {

        const systemCommands = commandsService.getSystemCommands();
        const customCommands = commandsService.getCustomCommands();
        const sortTags = commandsService.getSortTags();

        $scope.hasSortTags = sortTags != null && sortTags.length > 1;
        $scope.hasCustomCommands = customCommands != null && customCommands.length > 0;

        $scope.systemCommandOptions = {};
        for (const command of systemCommands) {
            $scope.systemCommandOptions[command.id] = command.trigger;
        }

        $scope.customCommandSortTags = {"": "No tag"};
        for (const sortTag of sortTags) {
            $scope.customCommandSortTags[sortTag.id] = sortTag.name;
        }

        $scope.customCommandOptions = {};
        for (const command of customCommands) {
            $scope.customCommandOptions[command.id] = command.trigger;
        }

        $scope.updateCustomCommandOptions = function(sortTagId) {
            $scope.customCommandOptions = {};

            if ($scope.customCommandSortTags.length === 1) {
                for (const command of customCommands) {
                    $scope.customCommandOptions[command.id] = command.trigger;
                }
        
            }

            for (const command of customCommands) {
                if (command.sortTags.length === 0) return;
                for (const tag of command.sortTags) {
                    if (tag === sortTagId) {
                        $scope.customCommandOptions[command.id] = command.trigger;
                    }
                }
            }
        };

        $scope.updateCommandSelection = function(selectedCommandId) {
            if ($scope.effect.commandType === 'system') {
                $scope.effect.command = systemCommands[selectedCommandId];
            }

            if ($scope.effect.commandType === 'custom') {
                $scope.effect.command = customCommands[selectedCommandId];
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
        if (effect.selectedCommandId == null) {
            errors.push("Please select a command.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        const { effect } = event;
        
        effect.command["active"] = effect.toggleType;

        if (effect.commandType === 'system') {   
            commandAccess.saveSystemCommandOverride(effect.command);
        }

        if (effect.commandType === 'custom') {
            commandAccess.saveNewCustomCommand(effect.command);
        }

        return true;
    }
};

module.exports = chat;
