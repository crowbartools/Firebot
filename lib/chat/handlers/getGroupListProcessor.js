'use strict';
const mixerInteractive = require('../../common/mixer-interactive');
const mixerChat = require('../../common/mixer-chat');

// Chat Specific Handler

function getGroupList(chatEvent, commandSender) {
    let allGroups = mixerInteractive.getGroups();

    let reply = `GROUPS: ${allGroups.join(", ")}`;
    mixerChat.whisper('streamer', commandSender, reply);
}

// Export Functions
exports.go = getGroupList;
