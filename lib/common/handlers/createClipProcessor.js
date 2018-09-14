"use strict";

const Chat = require("../mixer-chat");
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

    if (effect.postLink) {
        Chat.smartSend("Creating clip...");
    }

    let title = effect.clipTitle;
    if (title == null || title === "") {
        title = "$(streamTitle)";
    }

    title = await util.populateStringWithTriggerData(title, trigger);

    let duration = await util.populateStringWithTriggerData(effect.clipDuration.toString(), trigger);

    let clipResult = await Chat.createClip(title, duration);

    if (clipResult.success) {
        if (effect.postLink) {
            let streamerData = accountAccess.getAccounts().streamer;
            let message = `Clip created: https://mixer.com/${streamerData.username}?clip=${clipResult.highlightResponse.shareableId}`;
            Chat.smartSend(message);
        }
        logger.info("Successfully created a Mixer clip!");
    } else {
        if (effect.postLink) {
            Chat.smartSend("Whoops! Something went wrong when creating a clip. :(");
        }
        renderWindow.webContents.send('error', `Failed to create a clip on Mixer. Reason: ${clipResult.reason}`);
    }

    if (effect.download) {
        let streamLocator = clipResult.highlightResponse.contentLocators.find(l => l.locatorType === "HlsStreaming");
        if (streamLocator != null) {
            let streamUri = streamLocator.uri;
            try {
                await downloadAndSaveClip(streamUri, title);
                renderWindow.webContents.send('eventlog', {type: "general", username: "System:", event: `Successfully saved clip to download folder.`});
            } catch (e) {
                renderWindow.webContents.send('eventlog', {type: "general", username: "System:", event: `Failed to download and save clip for reason: ${e}`});
            }
        }
    }
};