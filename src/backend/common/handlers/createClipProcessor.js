"use strict";

const twitchChat = require("../../chat/twitch-chat");
const logger = require("../../logwrapper");
const accountAccess = require("../account-access");
const discordEmbedBuilder = require("../../integrations/builtin/discord/discord-embed-builder");
const discord = require("../../integrations/builtin/discord/discord-message-sender");
const utils = require("../../utility");

const twitchApi = require("../../twitch-api/api");

/**
 * @returns {Promise<HelixClip?>}
 */
exports.createClip = async function(effect) {

    const streamerAccount = accountAccess.getAccounts().streamer;
    const client = twitchApi.streamerClient;
    const broadcast = await client.streams.getStreamByUserId(streamerAccount.userId);
    const channelId = (await twitchApi.users.getUserById(streamerAccount.userId)).id;

    // if (broadcast == null) {
    //     frontendCommunicator.send('error', `Failed to create a clip. Reason: Streamer is not live.`);
    //     return null;
    // }

    if (effect.postLink) {
        await twitchChat.sendChatMessage("Creating clip...");
    }

    let clipId;

    try {
        clipId = await client.clips.createClip({
            channel: channelId
        });
    } catch (err) {
        //failed to create clip
        logger.error("failed to create clip", err);
    }

    if (clipId == null) {
        if (effect.postLink) {
            await twitchChat.sendChatMessage("Whoops! Something went wrong when creating a clip. :(");
        }
        return null;
    }

    /**@type {import('@twurple/api').HelixClip} */
    let clip;
    let attempts = 0;
    do {
        attempts++;
        try {
            clip = await client.clips.getClipById(clipId);
        } catch (err) {
            //failed to get clip
            logger.error("failed to create clip", err);
        }
        if (clip == null) {
            await utils.wait(1000);
        }
    }
    while (clip == null && attempts < 15);

    if (clip != null) {
        if (effect.postLink) {
            const message = `Clip created: ${clip.url}`;
            await twitchChat.sendChatMessage(message);
        }

        if (effect.postInDiscord) {
            const clipEmbed = await discordEmbedBuilder.buildClipEmbed(clip, effect.embedColor);
            await discord.sendDiscordMessage(effect.discordChannelId, "A new clip was created!", clipEmbed);
        }

        logger.info("Successfully created a clip!");
    } else {
        if (effect.postLink) {
            await twitchChat.sendChatMessage("Whoops! Something went wrong when creating a clip. :(");
        }
    }
    return clip;
};