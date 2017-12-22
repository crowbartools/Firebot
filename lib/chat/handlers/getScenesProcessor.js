'use strict';

const mixerInteractive = require('../../common/mixer-interactive');
const mixerChat = require('../../common/mixer-chat');

// Chat Specific Handler

function getScenes(trigger) {
    let scenes = mixerInteractive.getScenes();

    let reply = `SCENES: ${scenes.join(", ")}`;
    mixerChat.whisper('streamer', trigger.metadata.username, reply);
}


// Export Functions
exports.go = getScenes;
