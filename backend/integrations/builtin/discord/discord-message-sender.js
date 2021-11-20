"use strict";

const request = require("request");

const integrationManager = require("../../IntegrationManager");

async function sendDiscordMessage(discordChannelId, content, embed) {
    const discordIntegration = integrationManager.getIntegrationDefinitionById("discord");

    const discordSettings = discordIntegration.userSettings;

    const channels = discordSettings.webhookSettings && discordSettings.webhookSettings.channels;

    const channel = channels.find(c => c.id === discordChannelId);
    if (!channel) {
        return true;
    }

    if (content != null && content.length > 2000) {
        content = content.substring(0, 1999);
    }

    let webhookBody = {
        username: discordSettings.botOverrides.botName,
        avatar_url: discordSettings.botOverrides.botImageUrl, // eslint-disable-line camelcase
        content: content,
        embeds: embed ? [embed] : undefined
    };

    request.post(channel.webhookUrl, {
        json: true,
        body: webhookBody
    });
}

exports.sendDiscordMessage = sendDiscordMessage;