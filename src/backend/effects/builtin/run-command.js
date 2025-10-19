"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');
const commandManager = require("../../chat/commands/command-manager");
const chatHelpers = require("../../chat/chat-helpers");
const chatCommandHandler = require("../../chat/commands/chat-command-handler");
const commandRunner = require("../../chat/commands/command-runner");
const logger = require("../../logwrapper");
const { simpleClone } = require('../../utils');

/**
 * The Delay effect
 */
const model = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:runcommand",
        name: "Run Command",
        description: "Runs effects saved for the selected custom command.",
        icon: "fad fa-exclamation-square",
        categories: [EffectCategory.ADVANCED],
        dependencies: []
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
    <eos-container header="Command Type" pad-top="true">
        <dropdown-select options="{ system: 'System', custom: 'Custom'}" selected="effect.commandType"></dropdown-select>
    </eos-container>

        <eos-container header="Command To Run" pad-top="true">
            <firebot-searchable-select
                ng-show="effect.commandType === 'system'"
                ng-model="effect.systemCommandId"
                placeholder="Select or search for a command..."
                items="systemCommands"
                item-name="trigger"
            />

            <firebot-searchable-select
                ng-show="effect.commandType === 'custom'"
                ng-model="effect.commandId"
                placeholder="Select or search for a command..."
                items="customCommands"
                item-name="trigger"
            />
        </eos-container>

        <eos-container header="Arguments (optional)" pad-top="true">
            <input type="text" style="margin-top: 20px;" class="form-control" ng-model="effect.args" placeholder="Enter some arguments..." replace-variables>
        </eos-container>

        <eos-container header="User who triggers the command (optional)" pad-top="true">
            <input type="text" style="margin-top: 20px;" class="form-control" ng-model="effect.username" placeholder="Enter a username..." replace-variables>
        </eos-container>

        <eos-container header="Restrictions" pad-top="true">
            <firebot-checkbox
                model="effect.enforceRestrictions"
                label="Attempt to enforce restrictions"
            />
            <firebot-checkbox
                ng-if="effect.enforceRestrictions"
                model="effect.sendRestrictionFailureMessage"
                label="Send chat message on failure"
            />
        </eos-container>

        <eos-container>
            <div class="effect-info alert alert-info" pad-top="true">
                Please keep in mind you may get unexpected results when attempting to enforce restrictions or if any effects in the selected command have command specific things (such as $arg variables) when running outside the context of a chat event.
            </div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, commandsService) => {

        // if commandType is null we must assume "custom" to maintain backwards compat
        if ($scope.effect.commandType == null) {
            $scope.effect.commandType = "custom";
        }

        $scope.systemCommands = commandsService.getSystemCommands();
        $scope.customCommands = commandsService.getCustomCommands();
    },
    /**
   * When the effect is saved
   */
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.commandType === "custom" && (effect.commandId == null || effect.commandId === "")) {
            errors.push("Please select a custom command to run.");
        }
        if (effect.commandType === "system" && (effect.systemCommandId == null || effect.systemCommandId === "")) {
            errors.push("Please select a system command to run.");
        }
        return errors;
    },
    getDefaultLabel: (effect, commandsService) => {
        let command;
        if (effect.commandType === "system") {
            command = commandsService.getSystemCommands()
                .find(cmd => cmd.id === effect.systemCommandId);
        }
        if (effect.commandType === "custom") {
            command = commandsService.getCustomCommands()
                .find(cmd => cmd.id === effect.commandId);
        }
        return command?.trigger ?? "Unknown Command";
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async (event) => {
        const { effect, trigger } = event;

        const clonedTrigger = simpleClone(trigger);
        if (effect.username != null && effect.username.length > 0) {
            clonedTrigger.metadata.username = effect.username;
        }

        // ensure effect.args is not undefined/null if it is change it to string empty
        effect.args = effect.args ?? "";

        const commandId = effect.commandType === "system"
            ? effect.systemCommandId
            : effect.commandId || effect.customCommandId;

        const commandToRun = effect.commandType === "system"
            ? commandManager.getSystemCommandById(commandId).definition
            : commandManager.getCustomCommandById(commandId);

        if (!commandToRun) {
            logger.error(`Command ID ${commandId} not found`);
        }

        if (effect.enforceRestrictions === true) {
            const basicMessageText = `${commandToRun.trigger} ${effect.args}`;
            const chatMessage = chatHelpers.buildBasicFirebotChatMessage(
                basicMessageText,
                clonedTrigger.metadata.username
            );

            // Nullify roles to force role refresh on restriction checks
            chatMessage.roles = null;

            const userCmd = commandRunner.buildUserCommand(commandToRun, basicMessageText, clonedTrigger.metadata.username);
            const restrictionsPassed = await chatCommandHandler.checkCommandRestrictions(
                chatMessage,
                commandToRun,
                userCmd,
                effect.sendRestrictionFailureMessage === true
            );

            if (!restrictionsPassed) {
                logger.warn(`Cannot run command ${commandToRun.trigger}. Restrictions failed.`);
                return false;
            }
        }

        if (effect.commandType === "system") {
            commandRunner.runSystemCommandFromEffect(commandId, clonedTrigger, effect.args);
        } else {
            // always fall back to custom command to ensure backwards compat
            commandRunner.runCustomCommandFromEffect(commandId, clonedTrigger, effect.args);
        }
        return true;
    }
};

module.exports = model;
