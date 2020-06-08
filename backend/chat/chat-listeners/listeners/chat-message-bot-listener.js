"use strict";

const accountAccess = require("../../../common/account-access");
const commandHandler = require("../../../chat/commands/commandHandler");
const chatProcessor = require("../../../common/handlers/chatProcessor.js");

module.exports = {
    accountType: "bot",
    event: "ChatMessage",
    callback: (data) => {
        // if someone whispers the bot account, we want to act on that
        if (data.message.meta.whisper) {
            commandHandler.handleChatEvent(data);
            if (data.user_name !== accountAccess.getAccounts().streamer.username) {
                // Send to UI to show in chat window.
                chatProcessor.uiChatMessage(data);
            }
        }
    }
};