const dataAccess = require('../../data-access.js');
const mixerInteractive = require('../mixer-interactive');

const commandIndicator = "!";

function messageIsCommand(rawMessage) {
  return rawMessage.startsWith(commandIndicator)
}

function getParsedCommand(rawMessage) {
  if(!messageIsCommand(rawMessage)) { return null };
  
  var commandRegex = new RegExp("^" + commandIndicator + "(\\S+)\\b\\s?(.*)?","i");
  var matches = rawMessage.match(commandRegex);
  var command = matches[1];
  var rawArgs = matches[2] ? matches[2] : "";
  var arguments = rawArgs.split(" ");
  
  return {
    cmd: {
      value: command.toLowerCase(),
      is: function(array){ return array.includes(this.value) }
    },
    args: arguments
  }
}

function handleChatCommand(chatEvent, chatter) {
  var rawMessage = chatEvent.message.message[0].data.toLowerCase();

  var userCommand = getParsedCommand(rawMessage);
  if(userCommand == null) return;
  
  var isWhisper = chatEvent.message.meta.whisper === true;
  if(!isWhisper) {
    deleteChatMessage(chatEvent.id);
  }
  
  var commandSender = chatEvent.user_name;
  
  if(userCommand.cmd.is(['scene', 's', 'board', 'b'])) {
    if(userCommand.args.length > 0) {
      var userHasPermission = userIsInRole(chatEvent.user_roles, ['Owner','Mod']);
      if(userHasPermission) {
        var newScene = userCommand.args[0];
        
        // Get last board name.
        var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
        var gameName = dbSettings.getData('/interactive/lastBoard');      
        
        // Get settings for last board.
        var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);
        var scenes = dbControls.getData('./firebot/scenes');
        
        var selectedScene = scenes[newScene];
        
        if(selectedScene != null) {
          var groups = selectedScene.default;
          if(groups != null && groups.length > 0) {
            var groupId = groups[0];
            console.log(`changing ${chatEvent.user_name} to scene ${selectedScene.sceneName} via group ${groupId}`);
            var participant = mixerInteractive.getParticipantByUserId(chatEvent.user_id);
            mixerInteractive.changeGroups(participant, groupId);
          }          
        }        
      }
    }
  }
  if(userCommand.cmd.is(['groups'])) {
    if(userCommand.args.length > 1) {
    }
  }
  
  if(userCommand.cmd.is(['scenes', 'boards'])) {
    // Get last board name.
    var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
    var gameName = dbSettings.getData('/interactive/lastBoard');      
    
    // Get settings for last board.
    var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);
    var scenes = dbControls.getData('./firebot/scenes');
  
    
    var sceneNames = Object.keys(scenes).map((key) => {
       return scenes[key].sceneName;
    });
    
    var reply = `SCENES: ${sceneNames.join(", ")}`;
    sendReply(chatter, true, commandSender, reply);
  }
  
  if(userCommand.cmd.is(['changescene', 'cs', 'changeboard', 'cb'])) {
    if(userCommand.args.length > 1) {
    }
  }
}

function sendReply(chatter, shouldWhisper, sender, message) {
  var chatSocket;
  if(chatter === 'bot') {
    chatSocket = global.botChat;
  } else {
    chatSocket = global.streamerChat;
  }
  
  if(shouldWhisper) {
    chatSocket.call('whisper', [sender, message]);
  } else {
    chatSocket.call('msg', [message]);
  }
}

function userIsInRole(userRoles, approvedRoles) {
  var foundMatch = false;
  userRoles.forEach((uRole) => {
    if(approvedRoles.includes(uRole)) { foundMatch = true; }
  });
  return foundMatch;
}

function deleteChatMessage(id) {
  global.streamerChat.call('deleteMessage', [id]);
}

// Export Functions
exports.handleChatCommand = handleChatCommand;
exports.messageIsCommand = messageIsCommand;