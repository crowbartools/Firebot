"use strict";

const twitchApi = require("../../../twitch-api/api");

const accountAccess = require("../../../common/account-access");

function buildCustomEmbed(customEmbedData) {
    const customEmbed = {
        title: customEmbedData.title,
        url: customEmbedData.url,
        description: customEmbedData.description
    };

    if (customEmbedData.authorName) {
        customEmbed.author = {
            name: customEmbedData.authorName,
            icon_url: customEmbedData.authorIconUrl //eslint-disable-line camelcase
        };
    }
    if (customEmbedData.imageUrl) {
        customEmbed.image = {
            url: customEmbedData.imageUrl //eslint-disable-line camelcase
        };
    }
    return customEmbed;
}

async function buildChannelEmbed() {
    const streamer = accountAccess.getAccounts().streamer;

    /**@type {import('@twurple/api').HelixStream} */
    let currentStream;
    try {
        currentStream = await twitchApi.streamerClient.asUser(streamer.userId, async ctx => {
            return await ctx.streams.getStreamByUserId(streamer.userId);
        });
    } catch (error) {
        // stream not running
    }

    if (currentStream == null) {
        return null;
    }

    /**@type {import('@twurple/api').HelixUser} */
    let user;
    /**@type {import('@twurple/api').HelixGame} */
    let game;
    try {
        user = await currentStream.getUser();
        game = await currentStream.getGame();
    } catch (error) {
        //some other error
    }

    const channelEmbed = {
        title: currentStream.title,
        url: `https://twitch.tv/${user.name}`,
        color: 2210285,
        author: {
            name: user.displayName,
            icon_url: user.profilePictureUrl //eslint-disable-line camelcase
        },
        fields: game ? [
            {
                name: "Game",
                value: game.name,
                inline: true
            }
        ] : [],
        image: {
            url: currentStream.getThumbnailUrl(640, 360)
        }
    };

    return channelEmbed;
}

/**
 * @param {import('@twurple/api').HelixClip} clip
 */
async function buildClipEmbed(clip) {
    const streamer = accountAccess.getAccounts().streamer;
    const game = await clip.getGame();
    return {
        title: clip.title,
        url: clip.url,
        color: 2210285,
        footer: {
            text: streamer.username,
            icon_url: streamer.avatar //eslint-disable-line camelcase
        },
        fields: [
            {
                name: "Game",
                value: game.name,
                inline: true
            }
        ],
        image: {
            url: clip.thumbnailUrl
        },
        timestamp: clip.creationDate
    };
}

async function buildScreenshotEmbed(imageUrl) {
    const streamer = accountAccess.getAccounts().streamer;
    const channelInfo = await twitchApi.channels.getChannelInformation();
    return {
        title: channelInfo.title,
        color: 2210285,
        footer: {
            text: streamer.username,
            icon_url: streamer.avatar //eslint-disable-line camelcase
        },
        fields: [
            {
                name: "Game",
                value: channelInfo.gameName,
                inline: true
            }
        ],
        image: {
            url: imageUrl
        },
        timestamp: new Date()
    };
}

async function buildEmbed(embedType, customEmbedData) {
    switch (embedType) {
    case "channel": {
        const channelEmbed = await buildChannelEmbed();
        if (channelEmbed) {
            channelEmbed.allowed_mentions = { //eslint-disable-line camelcase
                parse: ["users", "roles", "everyone"]
            };
            return channelEmbed;
        }
        return null;
    }
    case "custom": {
        return buildCustomEmbed(customEmbedData);
    }
    default:
        return null;
    }
}

exports.buildEmbed = buildEmbed;
exports.buildClipEmbed = buildClipEmbed;
exports.buildScreenshotEmbed = buildScreenshotEmbed;