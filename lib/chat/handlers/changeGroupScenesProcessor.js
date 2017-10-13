const dataAccess = require('../../common/data-access.js');
const mixerInteractive = require('../../common/mixer-interactive');
const mixerChat = require('../../common/mixer-chat');

// Chat Specific Handler

// This changes a group from one scene to another via chat command.
function changeGroupScenes(userCommand, chatEvent, commandSender){
  console.log('change group scene')
  console.log(userCommand);
    var reply = ``;
    if(userCommand.args.length > 0) {
      if(userCommand.args.length == 1) {
        reply = `Please indicate a group name. Use !groups for a list.`;  
      } else {
        var scene = userCommand.args[0];
        var group = userCommand.args[1];
      
        if(!mixerInteractive.getScenes().includes(scene)) {
          reply = `The scene '${scene}' doesn't exist.`;  
        }
        else if(!mixerInteractive.getGroups().includes(group)) {
          reply = `That group '${group}' doesn't exist.`;
        } else {
          reply = `Changing the group '${group}' to scene '${scene}'...`;
          mixerInteractive.changeScenes(group, scene);
        }        
      }
    } else {
      reply = `Invalid use. !${userCommand.cmd.value} [scene] [group]`;    
    }
    mixerChat.whisper('bot', commandSender, reply);

    if(!isWhisper) {
      mixerChat.deleteChatMessage(chatEvent.id);
    }
}


// Export Functions
exports.go = changeGroupScenes;