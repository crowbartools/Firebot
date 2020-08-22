"use strict";

const effectRunner = require("../../common/effect-runner");
const { TriggerType } = require("../../common/EffectType");

exports.execute = function(command, userCommand, firebotChatMessage, manual = false) {
    let processEffectsRequest = {
        trigger: {
            type: manual ? TriggerType.MANUAL : TriggerType.COMMAND,
            metadata: {
                username: userCommand.commandSender,
                command: command,
                userCommand: userCommand,
                chatMessage: firebotChatMessage
            }
        },
        effects: command.effects
    };
    return effectRunner.processEffects(processEffectsRequest).catch(reason => {
        console.log("error when running effects: " + reason);
    });
};
