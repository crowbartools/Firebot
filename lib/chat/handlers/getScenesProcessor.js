const dataAccess = require('../../common/data-access.js');
const mixerInteractive = require('../../common/mixer-interactive');
const mixerChat = require('../../common/mixer-chat');

// Chat Specific Handler

function getScenes(firebot, commandSender, chatEvent){
    var scenes = mixerInteractive.getScenes();
    
    var reply = `SCENES: ${scenes.join(", ")}`;
    mixerChat.whisper('bot', commandSender, reply)

    if(!isWhisper) {
      mixerChat.deleteChatMessage(chatEvent.id);
    }
}


// Export Functions
exports.go = getScenes;