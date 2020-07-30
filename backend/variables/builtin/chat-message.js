// Migration: info needed
"use strict";
const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType } = require("../../../shared/variable-contants");

let triggers = {};
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = ["twitch:chat-message"];

const model = {
    definition: {
        handle: "chatMessage",
        description: "Outputs the chat message from the associated command or event.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (trigger) => {

        let chatMessage = "";

        if (trigger.type === EffectTrigger.COMMAND) {

            //if trigger is command, rebuild chat message with trigger and args
            let userCommand = trigger.metadata.userCommand;
            chatMessage = `${userCommand.trigger} ${userCommand.args.join(" ")}`;

        } else if (trigger.type === EffectTrigger.EVENT) {

            // if trigger is event, build chat message from chat event data
            chatMessage = trigger.metadata.eventData.messageText;
        }

        return chatMessage.trim();
    }
};

module.exports = model;
