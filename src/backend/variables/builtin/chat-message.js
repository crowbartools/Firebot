// Migration: info needed
"use strict";

const { EffectTrigger } = require("../../../shared/effect-constants");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const triggers = {};
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = [
    "twitch:chat-message",
    "twitch:first-time-chat",
    "firebot:highlight-message",
    "twitch:announcement",
    "twitch:viewer-arrived"
];

const model = {
    definition: {
        handle: "chatMessage",
        description: "Outputs the chat message from the associated command or event.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (trigger) => {

        let chatMessage = "";

        if (trigger.type === EffectTrigger.COMMAND) {

            //if trigger is command, rebuild chat message with trigger and args
            const userCommand = trigger.metadata.userCommand;
            chatMessage = `${userCommand.trigger} ${userCommand.args.join(" ")}`;

        } else if (trigger.type === EffectTrigger.EVENT || trigger.type === EffectTrigger.MANUAL) {
            // if trigger is event/manual event, build chat message from chat event data
            chatMessage = trigger.metadata.chatMessage || trigger.metadata.eventData.messageText;
        }

        return chatMessage.trim();
    }
};

module.exports = model;
