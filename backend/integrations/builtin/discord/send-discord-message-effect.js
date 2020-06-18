"use strict";

const { ControlKind, InputEvent } = require('../../../interactive/constants/MixplayConstants');
const effectModels = require("../../../effects/models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require("../../../../shared/effect-constants");

const request = require("request");

const integrationManager = require("../../IntegrationManager");

const frontEndCommunicator = require("../../../common/frontend-communicator");
frontEndCommunicator.onAsync("getDiscordChannels", async () => {
    let channels = [];
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
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
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
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.message == null || effect.message.trim().length < 1) {
            errors.push("Please provide a message");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;

        const discordIntegration = integrationManager.getIntegrationDefinitionById("discord");

        const discordSettings = discordIntegration.userSettings;

        const channels = discordSettings.webhookSettings && discordSettings.webhookSettings.channels;

        const channel = channels.find(c => c.id === effect.channelId);
        if (!channel) return true;

        let webhookBody = {
            username: discordSettings.botOverrides.botName,
            avatar_url: discordSettings.botOverrides.botImageUrl, // eslint-disable-line camelcase
            content: effect.message.length <= 2000 ? effect.message : effect.message.substring(0, 1999)
        };

        request.post(channel.webhookUrl, {
            json: true,
            body: webhookBody
        });

        return true;
    }
};