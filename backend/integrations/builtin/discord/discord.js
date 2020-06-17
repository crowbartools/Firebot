"use strict";
const EventEmitter = require("events");

const integrationDefinition = {
    id: "discord",
    name: "Discord",
    description: "Send messages to Discord channels.",
    linkType: "none",
    configurable: true,
    settingCategories: {
        webhookSettings: {
            title: "Settings",
            settings: {
                botName: {
                    title: "Bot Name",
                    description: "The name of the user that will post messages.",
                    type: "string",
                    tip: "Optional."
                },
                botImageUrl: {
                    title: "Bot Image URL",
                    description: "The URL of the avatar image of the user posting messages.",
                    type: "string",
                    tip: "Optional.",
                    hasBottomHr: true
                },
                channels: {
                    title: "Channels",
                    type: "discord-channel-webhooks"
                }
            }
        }
    },
    connectionToggle: false
};

class DiscordIntegration extends EventEmitter {
    constructor() {
        super();
    }
    init(integrationData) {}
    onUserSettingsUpdate(integrationData) {
        console.log(integrationData);
    }
    connect(integrationData) {}
    disconnect() {}
    link(linkData) {}
    unlink() {}
}

module.exports = {
    definition: integrationDefinition,
    integration: new DiscordIntegration()
};
