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
    cmd: command.toLowerCase(),
    args: arguments
  }
}

function handleChatCommand(chatEvent) {
  var rawMessage = chatEvent.message.message[0].data.toLowerCase();
  
  var userCommand = getParsedCommand(rawMessage);
  if(userCommand == null) return;
  
  if(userCommand.cmd === 'scene' || userCommand.cmd === 'board') {
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
            // mixerInteractive.changeGroups(/* need participant object */, groupId);
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

// Export Functions
exports.handleChatCommand = handleChatCommand;
exports.messageIsCommand = messageIsCommand;