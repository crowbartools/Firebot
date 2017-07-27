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

function handleChatCommand(chatEvent) {
  var rawMessage = chatEvent.message.message[0].data.toLowerCase();

  var userCommand = getParsedCommand(rawMessage);
  if(userCommand == null) return;
  
  var isWhisper = chatEvent.message.meta.whisper === true;
  if(!isWhisper) {
    deleteChatMessage(chatEvent.id);
  }
  
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