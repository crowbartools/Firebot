"use strict";

const twitchChat = require("../../chat/twitch-chat");
const logger = require("../../logwrapper");
const accountAccess = require("../account-access");
const { settings } = require("../settings-access");
const sanitize = require("sanitize-filename");
const path = require("path");
const discordEmbedBuilder = require("../../integrations/builtin/discord/discord-embed-builder");
const discord = require("../../integrations/builtin/discord/discord-message-sender");
const downloadClip = require("./clip-downloader");

const twitchApi = require("../../twitch-api/client");
const client = twitchApi.getClient();

function downloadAndSaveClip(clipProperties) {
    return new Promise((resolve, reject) => {
        logger.debug("Starting clip download...");

        const uri = clipProperties.url;
        if (uri == null || uri === "") {
            return reject("Invalid uri");
        }

        const title = sanitize(`${clipProperties.title}-${clipProperties.creationDate}`);
        const clipsDownloadFolder = settings.getClipDownloadFolder();
        const fullPath = path.join(clipsDownloadFolder, title + ".mp4");

        downloadClip(uri, fullPath).then(() => {
            logger.debug("Successfully completed clip download!");
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
    const broadcast = await client.helix.streams.getStreamByUserName(streamerAccount.username);
    const channelId = (await client.helix.users.getUserByName(streamerAccount.username)).id;

    if (broadcast == null) {
        renderWindow.webContents.send('error', `Failed to create a clip. Reason: Streamer is not live.`);
        return false;
    }

    if (effect.postLink) {
        twitchChat.sendChatMessage("Creating clip...");
    }

    const clipId = await client.helix.clips.createClip({
        channelId: channelId,
        createAfterDelay: true
    });

    if (clipId == null) {
        if (effect.postLink) {
            twitchChat.sendChatMessage("Whoops! Something went wrong when creating a clip. :(");
        }
        renderWindow.webContents.send('error', `Failed to create a clip.`);
        return;
    }

    const clip = await client.helix.clips.getClipById(clipId);

    if (clip != null) {
        if (effect.postLink) {
            const message = `${clip.url}`;
            twitchChat.sendChatMessage(message);
        }

        /** Discord embed has not been converted for twitch yet 6/28/20
        if (effect.postInDiscord) {
            const clipEmbed = await discordEmbedBuilder.buildClipEmbed(clip);
            discord.sendDiscordMessage(effect.discordChannelId, "A new clip was created!", clipEmbed);
        }
         */

        if (effect.download) {
            try {
                //await downloadAndSaveClip(clip);
                renderWindow.webContents.send('eventlog', {type: "general", username: "System:", event: `Successfully saved clip to download folder.`});
            } catch (e) {
                renderWindow.webContents.send('eventlog', {type: "general", username: "System:", event: `Failed to download and save clip for reason: ${e}`});
            }
        }

        logger.info("Successfully created a clip!");
    } else {
        if (effect.postLink) {
            twitchChat.sendChatMessage("Whoops! Something went wrong when creating a clip. :(");
        }
        renderWindow.webContents.send('error', `Failed to create a clip.`);
    }
    return true;
};