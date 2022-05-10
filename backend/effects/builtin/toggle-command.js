"use strict";

const frontendCommunicator = require("../../common/frontend-communicator");
const commandManager = require("../../chat/commands/CommandManager");
const { EffectCategory } = require('../../../shared/effect-constants');

const chat = {
    definition: {
        id: "firebot:toggle-command",
        name: "Toggle Command",
        description: "Toggle a command's active status",
        icon: "fad fa-toggle-off",
        categories: [EffectCategory.COMMON],
        dependencies: []
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
            <ui-select ng-model="effect.commandId" theme="bootstrap">
                <ui-select-match placeholder="Select or search for a command... ">{{$select.selected.trigger}}</ui-select-match>
                <ui-select-choices repeat="command.id as command in systemCommands | filter: { trigger: $select.search }" style="position:relative;">
                    <div ng-bind-html="command.trigger | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>
        </eos-container>

        <eos-container ng-show="effect.commandType === 'custom'" header="Custom Commands" pad-top="true">
            <ui-select ng-model="effect.commandId" theme="bootstrap">
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

        $scope.toggleOptions = {
            disable: "Deactivate",
            enable: "Activate",
            toggle: "Toggle"
        };

        if ($scope.effect.toggleType == null) {
            $scope.effect.toggleType = "disable";
        }
    },
    optionsValidator: effect => {
        const errors = [];
        if (effect.commandId == null) {
            errors.push("Please select a command.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        const { commandId, commandType, toggleType } = event.effect;

        if (commandType === "system") {
            const systemCommand = commandManager
                .getAllSystemCommandDefinitions().find(c => c.id === commandId);

            if (systemCommand == null) {
                // command doesnt exist anymore
                return true;
            }

            systemCommand.active = toggleType === "toggle" ? !systemCommand.active : toggleType === "enable";

            commandManager.saveSystemCommandOverride(systemCommand);

            frontendCommunicator.send("systemCommandsUpdated");
        } else if (commandType === "custom") {
            const customCommand = commandManager.getCustomCommandById(commandId);

            if (customCommand == null) {
                // command doesnt exist anymore
                return true;
            }

            customCommand.active = toggleType === "toggle" ? !customCommand.active : toggleType === "enable";

            commandManager.saveCustomCommand(customCommand, "System", false);

            frontendCommunicator.send("custom-commands-updated");
        }
    }
};

module.exports = chat;
