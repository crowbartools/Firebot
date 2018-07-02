"use strict";

const Chat = require("../mixer-chat");
const util = require("../../utility");
const logger = require("../../logwrapper");
const accountAccess = require("../account-access");

exports.createClip = async function(effect, trigger) {

    let title = effect.clipTitle;
    if (title != null && title !== "") {
        title = await util.populateStringWithTriggerData(title, trigger);
    }

    let clipResult = await Chat.createClip(title, effect.clipDuration);

    if (clipResult.success) {
        if (effect.postLink) {
            let streamerData = accountAccess.getAccounts().streamer;
            let message = `Successfully created a clip! https://mixer.com/${streamerData.useranme}?clip=${clipResult.shareId}`;
            Chat.smartSend(message);
        }
        logger.info("Successfully created a Mixer clip!");
    } else {
        renderWindow.webContents.send('error', `Failed to create a clip on Mixer. Reason: ${clipResult.reason}`);
    }
};