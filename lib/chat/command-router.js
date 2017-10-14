const dataAccess = require('../common/data-access.js');
const mixerInteractive = require('../common/mixer-interactive');
const mixerChat = require('../common/mixer-chat');
const groupsAccess = require('../common/groups-access');
const effectRunner = require('../common/effect-runner.js');

// TO DO: Make this adjustable via a setting in Firebot.
const commandIndicator = "!";

// This array holds ids of messages that have recently been handled by a logged in account.
var handledMessageIds = [];

// This holds a list of command id's and the time they are off cooldown.
var cooldownSaved = [];

// This holds the name of the streamer
var streamerName = false;

// This function is basically like a security checkpoint. It checks the chat message against several rules and sends it on.
function handleChatCommand(chatEvent, chatter, interactiveCache, commandCache) {
  var rawMessage = chatEvent.message.message[0].data;
  var isWhisper = chatEvent.message.meta.whisper === true;
  var commandSender = chatEvent.user_name;   // Username of the person that sent the command.

  // Parses command and sees if it is null or not.
  var userCommand = getParsedCommand(rawMessage);
  if(userCommand == null) return;
  
  // If the chat came from a bot, ignore it.
  if(!isWhisper && chatter.toLowerCase() === 'bot') {
    return;
  }
  
 // Check to see if handled message array contains the id of this message already.
 // If it does, that means that one of the logged in accounts has already handled the message.
  if(handledMessageIds.includes(chatEvent.id)) {
    // We can remove the handled id now, to keep the array small.
    handledMessageIds = handledMessageIds.filter(id => id !== chatEvent.id);
    return;
  } else {
    // throw the message id into the array. This prevents both the bot and the streamer accounts from replying
    handledMessageIds.push(chatEvent.id);
  }

  // Get commands
  var dbCommands = mixerChat.getCommandCache();
  var activeCommands = dbCommands['Active'];

  // Loop through commands and look for matching trigger.
  for (command in activeCommands){
    var command = activeCommands[command];
    var trigger = command['trigger'];

    // Check to see if the command matches a trigger from our commands file.
    if(userCommand['cmd'].value == trigger){

      // Check to see if this command has permissions assigned to it.
      if(Object.prototype.toString.call( command.permissions ) === '[object Array]' && command.permissions.length > 0){

        // We have some permissions to check against. So, lets see if any of them match the user.
        var userHasPermission = userIsInRole(getCombinedRoles(commandSender,chatEvent), mapRoleNames(command.permissions));

        if(!userHasPermission && commandSender !== streamerName) { 
          console.log(commandSender+ ' said a thing without permission!')
          // User doesn't have permission.
          mixerChat.whisper('bot', commandSender, "You do not have permission to use this command!");
          return; 
        } else {
          // User has permission or is the streamer.
          if ( cooldownChecker(command.commandID, command.cooldown) === true || commandSender == streamerName){
            processChatEffects(commandSender, isWhisper, command, interactiveCache, chatEvent, userCommand, false);
          } else {
            mixerChat.whisper('bot', commandSender, "This command is on cooldown!");
          }
          return;
        }
      } else {
        // No permissions to check against. Run the command because anyone can use this command.
        if ( cooldownChecker(command.commandID, command.cooldown) === true || commandSender == streamerName){
          processChatEffects(commandSender, isWhisper, command, interactiveCache, chatEvent, userCommand, false);
        } else {
          mixerChat.whisper('bot', commandSender, "This command is on cooldown!");
        }
        return;
      }

    }
  }
}

// This function builds out a effects package to be sent on after all checks have passed.
function processChatEffects(commandSender, isWhisper, command, interactiveCache, chatEvent, userCommand, timedCmd){

  // Create a fake control packet.
  var control = { 
    controlId: command.commandID,
    text: command.commandID,
    cost: command.cost,
    cooldown: command.cooldown
  }

  var processEffectsRequest = {
    type: "command",
    command: command,
    control: control,
    userCommand: userCommand,
    effects: command.effects,
    chatEvent: chatEvent,
    participant: {username: commandSender},
    isWhisper: isWhisper,
    firebot: interactiveCache,
    isManual: timedCmd
  } 

  // Send off the package to the real hero of firebot.
  effectRunner.processEffects(processEffectsRequest);

  // Log the action in Firebot's log.
  if(command.skipLog !== true){
    renderWindow.webContents.send('eventlog', {username: commandSender, event: "used the "+command.commandID+" command."});
  }
}

// This maps the apps role names to actual mixer chat role names.
function mapRoleNames(permissions){
  return permissions.map((p) => {
    switch(p){
      case "Moderators":
        return "Mod"
      case "Subscribers":
        return "Subscriber"
      default:
        return p;
    }
  });
}

// This takes a username and chat event, and returns an array of all standard roles and viewer groups they're in.
function getCombinedRoles(username, chatEvent){
  var chatterRoles = chatEvent.user_roles;
  var chatterCustomRoles = groupsAccess.getGroupsForUser(username);
  for(role in chatterCustomRoles){
    chatterRoles.push(chatterCustomRoles[role].groupName);
  }
  return chatterRoles;
}

// Checks to see if the chat message is a command.
function messageIsCommand(rawMessage) {
  return rawMessage.startsWith(commandIndicator)
}

// Parses command and returns command and arguments.
function getParsedCommand(rawMessage) {
  if(!messageIsCommand(rawMessage)) { return null };
  
  var commandRegex = new RegExp("^" + commandIndicator + "(\\S+)\\b\\s?(.*)?","i");
  var matches = rawMessage.match(commandRegex);
  var command = matches[1];
  var rawArgs = matches[2] ? matches[2] : "";
  var arguments = rawArgs.split(" ");
  
  if(arguments.length == 1 && arguments[0] == "") {
    arguments = [];
  }

  return {
    cmd: {
      value: command.toLowerCase(),
      is: function(array){ return array.includes(this.value) }
    },
    args: arguments
  }
}

// This checks to see if the user is in a specific role.
function userIsInRole(userRoles, approvedRoles) {
  var foundMatch = false;
  userRoles.forEach((uRole) => {
    if(approvedRoles.includes(uRole)) { foundMatch = true; }
  });
  return foundMatch;
}

// Cooldown Checker
// This function checks to see if a button should be cooled down or not based on current cooldown count. 
// It will return true if the new cooldown is longer than what it was already.
function cooldownChecker(commandID, cooldown){
  if(cooldown != null || cooldown !== "" || cooldown !== "0"){
    var cooldown = parseInt(cooldown) * 1000;
    
    // Get current time in milliseconds
    var dateNow = Date.now();
  
    // Add cooldown amount to current time. Save to var newTime.
    var newTime = dateNow + cooldown;
  
    // Go look into cooldownSaved for this button. Save to var oldTime.
    var oldTime = cooldownSaved[commandID];
  
    // If new time is bigger than oldTime resolve true, else false.
    if(oldTime === undefined || dateNow > oldTime){
        // Push new value and resolve.
        cooldownSaved[commandID] = newTime;
        return true;
    } else {
        // Keep old time. We're still on cooldown.
        return false;
    }
  } else {
    // No cooldown entered, return true and let's fire the command.
    return true;
  }

}

// Update streamer username
function updateStreamerUsername(){
  var authDb = dataAccess.getJsonDbInUserData('/user-settings/auth');
  streamerName = authDb.getData('/streamer/username');
}


// Export Functions
exports.handleChatCommand = handleChatCommand;
exports.messageIsCommand = messageIsCommand;
exports.processChatEffects = processChatEffects;
exports.updateStreamerUsername = updateStreamerUsername;