"use strict";

const effectRunner = require("../../common/effect-runner");
const { TriggerType } = require("../../common/EffectType");

exports.execute = function(command, userCommand, firebotChatMessage, manual = false) {

    let effects = command.effects;
    if (command.subCommands && command.subCommands.length > 0 && userCommand.subcommandId != null) {
        if (userCommand.subcommandId === "fallback-subcommand" && command.fallbackSubcommand) {
            effects = command.fallbackSubcommand.effects;
        } else {
            const subcommand = command.subCommands.find(sc => sc.id === userCommand.subcommandId);
            if (subcommand) {
                effects = subcommand.effects;
            }
        }
    }

    const processEffectsRequest = {
        trigger: {
            type: manual ? TriggerType.MANUAL : TriggerType.COMMAND,
            metadata: {
                username: userCommand.commandSender,
                command: command,
                userCommand: userCommand,
                chatMessage: firebotChatMessage
            }
        },
        effects: effects
    };

    if (firebotChatMessage != null) {
        processEffectsRequest.trigger.metadata.userId = firebotChatMessage.userId;
        processEffectsRequest.trigger.metadata.userIdName = firebotChatMessage.userIdName;
    }

    return effectRunner.processEffects(processEffectsRequest).catch(reason => {
        console.log(`error when running effects: ${reason}`);
    });
};
