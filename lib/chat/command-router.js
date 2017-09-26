const dataAccess = require('../common/data-access.js');
const mixerInteractive = require('../common/mixer-interactive');
const mixerChat = require('../common/mixer-chat');
const groupsAccess = require('../common/groups-access');
const effectRunner = require('../common/effect-runner.js');

// TO DO: Make this adjustable via a setting in Firebot.
const commandIndicator = "!";

// This array holds ids of messages that have recently been handled by a logged in account.
var handledMessageIds = [];

// This function is basically like a security checkpoint. It checks the chat message against several rules and sends it on.
function handleChatCommand(chatEvent, chatter) {
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
  var dbCommands = dataAccess.getJsonDbInUserData("/user-settings/chat/commands");
  var activeCommands = dbCommands.getData('/Active');

  // Loop through commands and look for matching trigger.
  for (command in activeCommands){
    var command = activeCommands[command];
    var trigger = command['trigger'];

    // Check to see if the command matches a trigger fomr our commands file.
    if(userCommand['cmd'].value == trigger){
      
      // Check to see if the user's roles match the permissions for the command.
      if(Object.prototype.toString.call( command.permissions ) === '[object Array]' && command.permissions.length > 0){

        // We have some permissions to check against.
        var userHasPermission = userIsInRole(getCombinedRoles(commandSender,chatEvent), command.permissions);

        if(!userHasPermission && chatter.toLowerCase() !== 'streamer') { 
          // User doesn't have permission.
          console.log('User doesnt have permission to use this chat command.')
          mixerChat.whisper('bot', commandSender, "You do not have permission to use this command!");
          return; 
        } else {
          // User has permission or is the streamer.
          console.log('User has permission to use this chat command.')
          processChatEffects(commandSender, isWhisper, command);
          return;
        }

      } else {
        // No permissions to check against. Run the command because anyone can use this command.
        console.log('No permissions on this chat command. Anyone can use it!');
        processChatEffects(commandSender, isWhisper, command);
        return;
      }

    }
  }
}

// This function builds out a effects package to be sent on after all checks have passed.
function processChatEffects(commandSender, isWhisper, command){
  var processEffectsRequest = {
    command: command,
    effects: command.effects,
    commandSender: commandSender,
    isWhisper: isWhisper
  } 

  // Send off the package to the real hero of firebot.
  effectRunner.processEffects(processEffectsRequest);
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



// Export Functions
exports.handleChatCommand = handleChatCommand;
exports.messageIsCommand = messageIsCommand;