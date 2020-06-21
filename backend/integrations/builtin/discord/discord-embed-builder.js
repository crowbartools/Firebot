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
 * @param {import('../../../mixer-api/resource/clips').ClipProperties} clipProperties
 */
async function buildClipEmbed(clipProperties) {
    const thumbnail = clipProperties.contentLocators.find(c => c.locatorType === "Thumbnail_Large");
    const streamer = accountAccess.getAccounts().streamer;
    const type = await mixerApi.types.getChannelType(clipProperties.typeId);
    return {
        title: clipProperties.title,
        url: `https://mixer.com/${streamer.username}?clip=${clipProperties.shareableId}`,
        color: 2210285,
        footer: {
            text: streamer.username,
            icon_url: `https://mixer.com/api/v1/users/${streamer.userId}/avatar` //eslint-disable-line camelcase
        },
        fields: [
            {
                name: "Duration",
                value: `${clipProperties.durationInSeconds} secs`,
                inline: true
            },
            {
                name: "Game",
                value: type.name,
                inline: true
            }
        ],
        image: {
            url: thumbnail.uri
        },
        timestamp: clipProperties.uploadDate
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