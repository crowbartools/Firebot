"use strict";

const { EffectCategory } = require("../../../../shared/effect-constants");
const integrationManager = require("../../integration-manager");
const discordEmbedBuilder = require('./discord-embed-builder');
const discord = require("./discord-message-sender");
const frontEndCommunicator = require("../../../common/frontend-communicator");
const logger = require("../../../logwrapper");
const fs = require("fs-extra");

frontEndCommunicator.onAsync("getDiscordChannels", async () => {
    const channels = [];
    const discordIntegration = integrationManager.getIntegrationDefinitionById("discord");
    if (discordIntegration && discordIntegration.userSettings) {
        if (discordIntegration.userSettings.webhookSettings &&
            discordIntegration.userSettings.webhookSettings.channels) {
            return discordIntegration.userSettings.webhookSettings.channels;
        }
    }
    return channels;
});

module.exports = {
    definition: {
        id: "discord:send-message",
        name: "Send Discord Message",
        description: "Send a message and/or embed to a Discord channel",
        icon: "fab fa-discord",
        categories: [EffectCategory.INTEGRATIONS],
        dependencies: [],
        outputs: [
            {
                label: "Success status",
                description: "returns true if the message was sent successfully, false otherwise.",
                defaultName: "discordSuccess"
            },
            {
                label: "Message Output",
                description: "returns the discord message object if the message was sent successfully, returns an error otherwise.",
                defaultName: "discordMessage"
            }
        ]
    },
    globalSettings: {},
    optionsTemplate: `
        <div>
            <div ng-show="hasChannels">

                <eos-container header="Discord Channel">
                    <dropdown-select options="channelOptions" selected="effect.channelId"></dropdown-select>
                </eos-container>

                <eos-container header="Message" pad-top="true">
                    <textarea ng-model="effect.message" class="form-control" name="text" placeholder="Enter message" rows="4" cols="40" replace-variables></textarea>
                </eos-container>

                <eos-container header="Files ({{effect.files.length}}/10)" pad-top="true">
                    <discord-file-upload-list model="effect.files"></discord-file-upload-list>
                </eos-container>

                <eos-container header="Rich Embed" pad-top="true">
                    <label class="control-fb control--checkbox" style="margin-top:15px"> Include rich embed
                        <input type="checkbox" ng-model="effect.includeEmbed">
                        <div class="control__indicator"></div>
                    </label>

                    <div ng-show="effect.includeEmbed">
                        <dropdown-select options="embedOptions" selected="effect.embedType"></dropdown-select>

                        <div ng-show="effect.embedType === 'custom'">

                            <div style="margin-top:10px;">
                                <firebot-input input-title="Title" model="effect.customEmbed.title"></firebot-input>
                            </div>

                            <div style="margin-top:10px;">
                                <firebot-input input-title="URL" model="effect.customEmbed.url"></firebot-input>
                            </div>

                            <div style="margin-top:10px;">
                                <firebot-input input-title="Content" use-text-area="true" model="effect.customEmbed.description"></firebot-input>
                            </div>

                            <div style="margin-top:10px;">
                                <firebot-input input-title="Author Name" model="effect.customEmbed.authorName"></firebot-input>
                            </div>

                            <div style="margin-top:10px;">
                                <firebot-input input-title="Author Icon URL" model="effect.customEmbed.authorIconUrl"></firebot-input>
                            </div>

                            <div style="margin-top:10px;">
                                <firebot-input input-title="Image URL" model="effect.customEmbed.imageUrl"></firebot-input>
                            </div>

                        </div>

                        <div ng-show="effect.embedType === 'channel'">
                            <br /><b>*</b> Must be live for this to post.
                        </div>
                    </div>
                </eos-container>

            </div>
            <div ng-hide="hasChannels">
                <eos-container>
                    <span class="muted">No Discord channels configured yet! You can configure them in <b>Settings</b> > <b>Integrations</b> > <b>Discord</b></span>
                </eos-container>
            </div>
        </div>
    `,
    optionsController: ($scope, $q, backendCommunicator) => {

        $scope.hasChannels = false;
        $scope.channelOptions = {};
        $q.when(backendCommunicator.fireEventAsync("getDiscordChannels"))
            .then(channels => {
                if (channels && channels.length > 0) {
                    const newChannels = {};

                    for (const channel of channels) {
                        newChannels[channel.id] = channel.name;
                    }

                    if ($scope.effect.channelId == null ||
                        newChannels[$scope.effect.channelId] == null) {
                        $scope.effect.channelId = channels[0].id;
                    }

                    $scope.channelOptions = newChannels;

                    $scope.hasChannels = true;
                }
            });

        $scope.embedOptions = {
            channel: "Channel Details",
            custom: "Custom Embed"
        };

        if ($scope.effect.customEmbed == null) {
            $scope.effect.customEmbed = {};
        }
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (!effect.includeEmbed && !(Array.isArray(effect.files) && effect.files.length !== 0) && (effect.message == null || effect.message.trim().length < 1)) {
            errors.push("Please provide a message, embed or file.");
        }
        if (effect.includeEmbed && (effect.embedType == null || effect.embedType === "")) {
            errors.push("Please select a rich embed type");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;

        let embed;

        let files;

        if (effect.includeEmbed) {
            embed = await discordEmbedBuilder.buildEmbed(effect.embedType, effect.customEmbed);
        }

        if (effect.files != null && effect.files.length !== 0) {
            files = [];
            effect.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    files.push({name: file.name, file: fs.readFileSync(file.path)});
                } else {
                    logger.info("File not found, skipping: ", file);
                }
            });
            if (files.length === 0) {
                files = null;
            }
        }
        let response;

        try {
            response = await discord.sendDiscordMessage(effect.channelId, effect.message || "", embed, files);
            return {
                success: true,
                outputs: {
                    discordSuccess: true,
                    discordMessage: response
                }
            };
        } catch (err) {
            return {
                success: true,
                outputs: {
                    discordSuccess: false,
                    discordMessage: err
                }
            };
        }
    }
};
