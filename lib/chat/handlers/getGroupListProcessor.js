const dataAccess = require('../../common/data-access.js');
const mixerInteractive = require('../../common/mixer-interactive');
const mixerChat = require('../../common/mixer-chat');

// Chat Specific Handler

function getGroupList(chatEvent, commandSender){
    var allGroups = mixerInteractive.getGroups();
    
    var reply = `GROUPS: ${allGroups.join(", ")}`;
    mixerChat.whisper('bot', commandSender, reply);

    if(!isWhisper) {
      mixerChat.deleteChatMessage(chatEvent.id);
    }
}

// Export Functions
exports.go = getGroupList;