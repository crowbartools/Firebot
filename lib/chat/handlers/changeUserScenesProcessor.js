'use strict';

const dataAccess = require('../../common/data-access.js');
const mixerInteractive = require('../../common/mixer-interactive');
const mixerChat = require('../../common/mixer-chat');

// Chat Specific Handler

function changeUserScene(firebot, chatEvent, isWhisper, userCommand, commandSender) {
    console.log('change user scene');
    let reply = `There was an error executing the command!`;
    let newScene = userCommand.args[0];

    // Get last board name.
    let dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
    let gameName = dbSettings.getData('/interactive/lastBoardId');

    // Get settings for last board.
    let dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/" + gameName);
    let scenes = dbControls.getData('./firebot/scenes');

    let selectedScene = scenes[newScene];

    if (selectedScene != null && selectedScene.sceneName !== "default") {
        let groups = selectedScene.default;
        if (groups != null && groups.length > 0) {
            let groupId = groups[0];
            if (groupId !== "None") {
                console.log(`Changing ${chatEvent.user_name} to scene ${selectedScene.sceneName} via group ${groupId}...`);
                let participant = mixerInteractive.getParticipantByUserId(chatEvent.user_id);
                mixerInteractive.changeGroups(participant, groupId);
                reply = `Ta da! Welcome to the ` + groupId + ' user group!';
            } else {
                reply = `Oops! There are no active user groups using that scene. Unable to switch.`;
            }
        }
    } else if (selectedScene.sceneName === "default") {
        console.log('Changing to default scene...');
        // The default scene might not have any user groups under it.
        let groupId = "default";
        console.log(`Changing ${chatEvent.user_name} to scene ${selectedScene.sceneName} via group ${groupId}...`);
        let participant = mixerInteractive.getParticipantByUserId(chatEvent.user_id);
        mixerInteractive.changeGroups(participant, groupId);
        reply = `Ta da! Welcome to the ` + groupId + ' user group!';
    } else {
        // We couldn't find that scene at all.
        reply = `Oops! That scene doesnt seem to exist at all.`;
    }

    // Send confirmation message
    console.log(commandSender, reply);
    mixerChat.whisper('streamer', commandSender, reply);
}

// Export Functions
exports.go = changeUserScene;
