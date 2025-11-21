import type { EffectType } from "../../../types/effects";
import type { CommandDefinition, SystemCommandDefinition } from "../../../types/commands";

import { CommandManager } from "../../chat/commands/command-manager";
import chatHelpers from "../../chat/chat-helpers";
import chatCommandHandler from "../../chat/commands/chat-command-handler";
import commandRunner from "../../chat/commands/command-runner";
import logger from "../../logwrapper";
import { simpleClone } from '../../utils';

const effect: EffectType<{
    commandType: "system" | "custom";
    commandId: string;
    systemCommandId: string;
    username: string;
    args: string;
    enforceRestrictions: boolean;
    sendRestrictionFailureMessage: boolean;
    /** @deprecated */
    customCommandId: string;
}> = {
    definition: {
        id: "firebot:runcommand",
        name: "Run Command",
        description: "Runs effects saved for the selected custom command.",
        icon: "fad fa-exclamation-square",
        categories: ["advanced", "firebot control"],
        dependencies: []
    },
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
    optionsController: ($scope, commandsService) => {
        // if commandType is null we must assume "custom" to maintain backwards compat
        if ($scope.effect.commandType == null) {
            $scope.effect.commandType = "custom";
        }

        $scope.systemCommands = commandsService.getSystemCommands();
        $scope.customCommands = commandsService.getCustomCommands();
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.commandType === "custom" && (effect.commandId == null || effect.commandId === "")) {
            errors.push("Please select a custom command to run.");
        }
        if (effect.commandType === "system" && (effect.systemCommandId == null || effect.systemCommandId === "")) {
            errors.push("Please select a system command to run.");
        }
        return errors;
    },
    getDefaultLabel: (effect, commandsService) => {
        let command: CommandDefinition;
        if (effect.commandType === "system") {
            command = (commandsService.getSystemCommands() as SystemCommandDefinition[])
                .find(cmd => cmd.id === effect.systemCommandId);
        }
        if (effect.commandType === "custom") {
            command = (commandsService.getCustomCommands() as CommandDefinition[])
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
            ? CommandManager.getSystemCommandById(commandId).definition
            : CommandManager.getCustomCommandById(commandId);

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

export = effect;