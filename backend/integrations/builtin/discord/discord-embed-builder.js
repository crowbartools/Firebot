"use strict";

const mixerApi = require("../../../mixer-api/api");

const accountAccess = require("../../../common/account-access");

function buildCustomEmbed(customEmbedData) {
    const customEmbed = {
        title: customEmbedData.title,
        description: customEmbedData.description
    };

    if (customEmbedData.authorName) {
        customEmbed.author = {
            name: customEmbedData.authorName,
            icon_url: customEmbedData.authorIconUrl //eslint-disable-line camelcase
        };
    }
    return customEmbed;
}

async function buildChannelEmbed() {
    const streamerChannel = await mixerApi.channels.getStreamersChannel();

    const channelEmbed = {
        title: streamerChannel.name,
        url: `https://mixer.com/${streamerChannel.token}`,
        color: 2210285,
        author: {
            name: streamerChannel.token,
            icon_url: `https://mixer.com/api/v1/users/${streamerChannel.userId}/avatar` //eslint-disable-line camelcase
        },
        fields: [
            {
                name: "Game",
                value: streamerChannel.type ? streamerChannel.type.name : "No game set",
                inline: true
            },
            {
                name: "Audience",
                value: streamerChannel.audience,
                inline: true
            }
        ],
        image: {
            url: `https://thumbs.mixer.com/channel/${streamerChannel.id}.small.jpg`
        }
    };

    return channelEmbed;
}

/**
 * @param {import('twitch').HelixClip} clip
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

async function buildEmbed(embedType, customEmbedData) {
    switch (embedType) {
    case "channel": {
        let channelEmbed = await buildChannelEmbed();
        channelEmbed.allowed_mentions = { //eslint-disable-line camelcase
            parse: ["users", "roles", "everyone"]
        };
        return channelEmbed;
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