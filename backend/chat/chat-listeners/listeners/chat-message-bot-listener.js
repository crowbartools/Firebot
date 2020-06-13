"use strict";

const accountAccess = require("../../../common/account-access");
const commandHandler = require("../../../chat/commands/commandHandler");

module.exports = {
    accountType: "bot",
    event: "ChatMessage",
    callback: (data) => {
        const chatProcessor = require("../../../common/handlers/chatProcessor.js");
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