'use strict';

const mixerInteractive = require('../../common/mixer-interactive');
const mixerChat = require('../../common/mixer-chat');

// Chat Specific Handler

function getScenes(firebot, commandSender) {
    let scenes = mixerInteractive.getScenes();

    let reply = `SCENES: ${scenes.join(", ")}`;
    mixerChat.whisper('bot', commandSender, reply);
}


// Export Functions
exports.go = getScenes;
