"use strict";

const effectRunner = require("../../common/effect-runner");
const { TriggerType } = require("../../common/EffectType");

exports.execute = function(command, userCommand, chatEvent, isTimed = false) {
  let processEffectsRequest = {
    trigger: {
      type: TriggerType.COMMAND,
      metadata: {
        username: userCommand.sender,
        command: command,
        userCommand: userCommand,
        chatEvent: chatEvent,
        isTimed: isTimed
      }
    },
    effects: command.effects
  };
  return effectRunner.processEffects(processEffectsRequest);
};
