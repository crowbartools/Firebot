"use strict";
const FormData = require('form-data');

const integrationManager = require("../../integration-manager");
const logger = require("../../../logwrapper");

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

    let botName = null;
    let botImageUrl = null;

    if (discordSettings.botOverrides?.botName?.length > 0) {
        botName = discordSettings.botOverrides.botName;
    }

    if (discordSettings.botOverrides?.botImageUrl?.length > 0) {
        botImageUrl = discordSettings.botOverrides.botImageUrl;
    }

    const payload = {
        username: botName,
        avatar_url: botImageUrl, // eslint-disable-line camelcase
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


        /*form.submit(channel.webhookUrl + "?wait=true", (error, response) => {
            if (error) {
                console.log("Error sending screenshot discord message", error);
            }
        });*/

        return new Promise((resolve, reject) => {
            form.submit(`${channel.webhookUrl}?wait=true`, (error, response) => {
                if (error) {
                    logger.error("Error sending discord message with file(s)", error);
                    reject(error);
                }
                //resolve(response);
                const chunks = [];
                response.on('data', chunk => chunks.push(Buffer.from(chunk)));
                response.on('error', err => reject(err));
                response.on('end', () => {
                    const result = Buffer.concat(chunks).toString('utf8');
                    if (response.statusCode !== 200) {
                        reject(response.statusMessage);
                    } else {
                        resolve(result);
                    }
                });
            });
        });
    }

    const response = await fetch(`${channel.webhookUrl}?wait=true`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });
    return await response.text();
}

exports.sendDiscordMessage = sendDiscordMessage;