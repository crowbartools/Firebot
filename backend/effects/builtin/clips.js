"use strict";

const clipProcessor = require("../../common/handlers/createClipProcessor");
const { EffectDependency } = require("../models/effectModels");
const { EffectCategory } = require('../../../shared/effect-constants');

const clip = {
    definition: {
        id: "firebot:clip",
        name: "Create Clip",
        description: "Creates a clip on Twitch.",
        icon: "fad fa-film",
        categories: [EffectCategory.COMMON, EffectCategory.FUN],
        dependencies: [EffectDependency.CHAT]
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <div style="padding-top:15px">
                <label class="control-fb control--checkbox"> Post clip link in chat
                    <input type="checkbox" ng-model="effect.postLink">
                    <div class="control__indicator"></div>
                </label>
            </div>

            <div style="padding-top:15px" ng-show="hasChannels">
                <label class="control-fb control--checkbox"> Post clip in Discord channel
                    <input type="checkbox" ng-model="effect.postInDiscord">
                    <div class="control__indicator"></div>
                </label>
            </div>

            <div ng-show="effect.postInDiscord" style="margin-left: 30px;">
                <div>Discord Channel:</div>
                <dropdown-select options="channelOptions" selected="effect.discordChannelId"></dropdown-select>
            </div>

            <!--<div style="padding-top:20px">
                <label class="control-fb control--checkbox"> Download clip <tooltip text="'You can change which folder clips save to in the Settings tab.'"></tooltip>
                    <input type="checkbox" ng-model="effect.download">
                    <div class="control__indicator"></div>
                </label>
            </div>-->
        </eos-container>

        <eos-container>
            <div class="effect-info alert alert-warning">
                Note: You must be live for this effect to work.
            </div>
        </eos-container>
    `,
    optionsController: ($scope, $q, backendCommunicator) => {
        if ($scope.effect.clipDuration == null) {
            $scope.effect.clipDuration = 30;
        }

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
    optionsValidator: effect => {
        let errors = [];
        if (effect.postInDiscord && effect.discordChannelId == null) {
            errors.push("Please select Discord channel.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        return await clipProcessor.createClip(event.effect, event.trigger);
    }
};

module.exports = clip;
