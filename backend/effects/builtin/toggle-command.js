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
            <dropdown-select options="systemCommandOptions" selected="effect.selectedCommandId""></dropdown-select>
        </eos-container>

        <eos-container ng-show="effect.commandType === 'custom' && hasCustomCommands && hasSortTags" header="Sort Tag" pad-top="true">
            <dropdown-select options="customCommandSortTags" selected="effect.selectedSortTagId" on-update="updateCustomCommandOptions(effect.selectedSortTagId)"></dropdown-select>
        </eos-container>

        <eos-container ng-show="effect.commandType === 'custom' && effect.selectedSortTagId" header="Custom Command" pad-top="true">
            <dropdown-select options="customCommandOptions" selected="effect.selectedCommandId""></dropdown-select>
        </eos-container>

        <eos-container header="Toggle Action" pad-top="true">
            <dropdown-select options="toggleOptions" selected="effect.toggleType"></dropdown-select>
        </eos-container>
    `,
    optionsController: ($scope, commandsService) => {

        const systemCommands = commandsService.getSystemCommands();
        const customCommands = commandsService.getCustomCommands();
        const sortTags = commandsService.getSortTags();

        $scope.hasSortTags = sortTags != null && sortTags.length > 0;
        $scope.hasCustomCommands = customCommands != null && customCommands.length > 0;

        $scope.systemCommandOptions = {};
        for (const command of systemCommands) {
            $scope.systemCommandOptions[command.id] = command.trigger;
        }

        $scope.customCommandSortTags = {};
        for (const sortTag of sortTags) {
            $scope.customCommandSortTags[sortTag.id] = sortTag.name;
        }

        $scope.updateCustomCommandOptions = function(sortTagId) {
            $scope.customCommandOptions = {};

            for (const command of customCommands) {
                for (const tag of command.sortTags) {
                    if (tag === sortTagId) {
                        $scope.customCommandOptions[command.id] = command.trigger;
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
        if (effect.selectedCommandId == null) {
            errors.push("Please select a command.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        const { effect } = event;

        commandAccess.updateCommandActiveStatus(effect.selectedCommandId, effect.toggleType === "enable");

        return true;
    }
};

module.exports = chat;
