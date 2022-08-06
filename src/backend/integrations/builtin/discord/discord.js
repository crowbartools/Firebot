"use strict";
const EventEmitter = require("events");

const effectManager = require("../../../effects/effectManager");

const integrationDefinition = {
    id: "discord",
    name: "Discord",
    description: "Send messages to Discord channels.",
    linkType: "none",
    connectionToggle: false,
    configurable: true,
    settingCategories: {
        webhookSettings: {
            title: "Channel Setup",
            sortRank: 2,
            settings: {
                channels: {
                    title: "Saved Channels",
                    description: "The collection of channel names and webhook urls that Firebot can post messages to.",
                    type: "discord-channel-webhooks",
                    sortRank: 1
                }
            }
        },
        botOverrides: {
            title: "Bot Overrides",
            sortRank: 1,
            settings: {
                botName: {
                    title: "Bot Name",
                    description: "This overrides the bot name set for a webhook in Discord. If left empty, whatever name you set in Discord for the webhook will be used.",
                    type: "string",
                    tip: "Optional.",
                    sortRank: 1
                },
                botImageUrl: {
                    title: "Bot Image URL",
                    description: "This overrides the avatar image of bot posting images. If left empty, whatever profile pic you set in Discord for the webhook will be used.",
                    type: "string",
                    tip: "Optional.",
                    sortRank: 2
                }
            }
        }
    }
};

class DiscordIntegration extends EventEmitter {
    constructor() {
        super();
    }
    init() {
        effectManager.registerEffect(require('./send-discord-message-effect'));
    }
}

module.exports = {
    definition: integrationDefinition,
    integration: new DiscordIntegration()
};
