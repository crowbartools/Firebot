const dataAccess = require('../../common/data-access.js');
const mixerInteractive = require('../../common/mixer-interactive');
const mixerChat = require('../../common/mixer-chat');

// Chat Specific Handler

function changeUserScene(firebot, chatEvent, isWhisper, userCommand){
    console.log('change user scene');
    console.log(userCommand)

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
        console.log(`Changing ${chatEvent.user_name} to scene ${selectedScene.sceneName} via group ${groupId}...`);
        var participant = mixerInteractive.getParticipantByUserId(chatEvent.user_id);
        mixerInteractive.changeGroups(participant, groupId);
      }          
    }
}

// Export Functions
exports.go = changeUserScene;