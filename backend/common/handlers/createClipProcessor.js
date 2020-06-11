"use strict";

const chat = require("../../chat/chat");
const mixerApi = require("../../mixer-api/api");
const util = require("../../utility");
const logger = require("../../logwrapper");
const accountAccess = require("../account-access");
const { settings } = require("../settings-access");
const sanitize = require("sanitize-filename");
const moment = require("moment");
const path = require("path");
const downloadClip = require("./clip-downloader");

function downloadAndSaveClip(uri, title = "") {
    return new Promise((resolve, reject) => {
        logger.info("Starting clip download...");

        if (uri == null || uri === "") {
            return reject("Invalid uri");
        }

        let timestamp = moment().format("DD-MM-YY (HHmmss)");

        // sanitize title so its a valid filename and add timestamp to avoid name conflicts
        title = sanitize(`${title} ${timestamp}`);

        if (title === "") {
            return reject("Invalid title");
        }

        let clipsDownloadFolder = settings.getClipDownloadFolder();

        let fullPath = path.join(clipsDownloadFolder, title + ".mp4");

        downloadClip(uri, fullPath).then(() => {
            logger.info("Successfully completed clip download!");
            resolve();
        },
        (e) => {
            logger.warn("Failed to download clip: " + e, e);
            reject("Failed to download the clip. See logs for more info.");
        });
    });
}

exports.createClip = async function(effect, trigger) {

    const streamerAccount = accountAccess.getAccounts().streamer;
    const broadcast = await mixerApi.channels.getStreamersBroadcast();

    let streamerData = accountAccess.getAccounts().streamer;
    if (!streamerData.partnered && !streamerData.canClip) {
        logger.warn("An unapproved user type attempted to create a clip!");
        renderWindow.webContents.send('error', `Failed to create a clip on Mixer. Reason: Not allowed to create clips at this time.`);
        return false;
    }

    if (broadcast == null) {
        renderWindow.webContents.send('error', `Failed to create a clip on Mixer. Reason: Streamer channel is not live.`);
        return false;
    }

    if (effect.postLink) {
        chat.sendChatMessage("Creating clip...");
    }

    let title = effect.clipTitle;
    if (title == null || title === "") {
        title = "$streamTitle (Created by $user)";
    }
    title = await util.populateStringWithTriggerData(title, trigger);

    let duration = 30;
    if (effect.clipDuration != null) {
        let normalizedDuration = effect.clipDuration
            .toString()
            .trim()
            .replace("s", "");

        if (!isNaN(normalizedDuration)) {
            duration = parseInt(normalizedDuration);
        }
    }

    // enforce limits
    if (duration < 5) {
        duration = 5;
    } else if (duration > 300) {
        duration = 300;
    }

    const clipProperties = await mixerApi.clips.createClip({
        broadcastId: broadcast.id,
        clipDurationInSeconds: duration,
        highlightTitle: title
    });

    const creationSuccessful = clipProperties != null;

    if (creationSuccessful) {
        if (effect.postLink) {
            const message = `Clip created: https://mixer.com/${streamerAccount.username}?clip=${clipProperties.shareableId}`;
            chat.sendChatMessage(message);
        }

        const streamLocator = clipProperties.contentLocators.find(l => l.locatorType === "HlsStreaming");
        if (streamLocator != null) {
            try {
                await downloadAndSaveClip(streamLocator.uri, title);
                renderWindow.webContents.send('eventlog', {type: "general", username: "System:", event: `Successfully saved clip to download folder.`});
            } catch (e) {
                renderWindow.webContents.send('eventlog', {type: "general", username: "System:", event: `Failed to download and save clip for reason: ${e}`});
            }
        }

        logger.info("Successfully created a Mixer clip!");
    } else {
        if (effect.postLink) {
            chat.sendChatMessage("Whoops! Something went wrong when creating a clip. :(");
        }
        renderWindow.webContents.send('error', `Failed to create a clip on Mixer`);
    }
    return true;
};