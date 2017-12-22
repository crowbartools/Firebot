'use strict';
const mixerInteractive = require('../../common/mixer-interactive');
const mixerChat = require('../../common/mixer-chat');

// Chat Specific Handler

function getGroupList(trigger) {
    let allGroups = mixerInteractive.getGroups();

    let reply = `GROUPS: ${allGroups.join(", ")}`;
    mixerChat.whisper('streamer', trigger.metadata.username, reply);
}

// Export Functions
exports.go = getGroupList;
