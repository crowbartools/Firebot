"use strict";
const FormData = require('form-data');

const axiosDefault = require("axios").default;

const axios = axiosDefault.create();

const integrationManager = require("../../IntegrationManager");

/**
 *
 * @param {*} discordChannelId
 * @param {*} content
 * @param {*} embed
 * @param {Array<{ file: Buffer; name: string; description: string}>} files
 * @returns
 */
async function sendDiscordMessage(discordChannelId, content, embed, files = null) {
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

    let payload = {
        username: discordSettings.botOverrides.botName,
        avatar_url: discordSettings.botOverrides.botImageUrl, // eslint-disable-line camelcase
        content: content,
        embeds: embed ? [embed] : undefined
    };

    if (files != null && Array.isArray(files)) {
        const form = new FormData();

        payload.attachments = files.map((f, i) => ({
            id: i,
            filename: f.name,
            description: f.description
        }));
        form.append("payload_json", JSON.stringify(payload));

        for (const [index, file] of files.entries()) {
            form.append(`files[${index}]`, file.file, {
                filename: file.name
            });
        }


        form.submit(channel.webhookUrl, (error) => {
            if (error) {
                console.log("Error sending screenshot discord message", error);
            }
        });

        return;
    }

    axios.post(channel.webhookUrl, payload).catch(error => {
        console.log("Failed to send webhook", error);
    });
}

exports.sendDiscordMessage = sendDiscordMessage;