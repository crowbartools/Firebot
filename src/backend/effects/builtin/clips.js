"use strict";

const clipProcessor = require("../../common/handlers/createClipProcessor");
const { EffectCategory, EffectDependency } = require('../../../shared/effect-constants');
const { SettingsManager } = require("../../common/settings-manager");
const mediaProcessor = require("../../common/handlers/mediaProcessor");
const webServer = require("../../../server/http-server-manager");
const utils = require("../../utility");
const customVariableManager = require("../../common/custom-variable-manager");
const { resolveTwitchClipVideoUrl } = require("../../common/handlers/twitch-clip-url-resolver");

const clip = {
    definition: {
        id: "firebot:clip",
        name: "Create Clip",
        description: "Creates a clip on Twitch.",
        icon: "fad fa-film",
        categories: [EffectCategory.COMMON, EffectCategory.FUN, EffectCategory.TWITCH],
        dependencies: [EffectDependency.CHAT],
        outputs: [
            {
                label: "Clip Url",
                description: "The url of the created clip",
                defaultName: "clipUrl"
            }
        ]
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
                <div style="margin-top:10px;">
                    <color-picker-input model="effect.embedColor" label="Embed Color"></color-picker-input>
                </div>
            </div>

            <div style="padding-top:15px">
                <label class="control-fb control--checkbox"> Show clip in overlay
                    <input type="checkbox" ng-model="effect.showInOverlay">
                    <div class="control__indicator"></div>
                </label>
            </div>

            <div style="padding-top:15px">
                <label class="control-fb control--checkbox"> Store the clip's URL in a $customVariable <tooltip text="'Store the URL of the clip in a $customVariable so you can use it later'"></tooltip>
                    <input type="checkbox" ng-model="effect.options.putClipUrlInVariable">
                    <div class="control__indicator"></div>
                </label>
                <div ng-if="effect.options.putClipUrlInVariable" style="padding-left: 15px;">
                    <firebot-input input-title="Variable Name" model="effect.options.variableName" placeholder-text="Enter name" />
                    <firebot-input style="margin-top: 10px;" input-title="Variable TTL" model="effect.options.variableTtl" input-type="number" disable-variables="true" placeholder-text="Enter secs | Optional" />
                    <firebot-input style="margin-top: 10px;" input-title="Variable Property Path" model="effect.options.variablePropertyPath" input-type="text" disable-variables="true" placeholder-text="Optional" />
                </div>
            </div>

            <!--<div style="padding-top:20px">
                <label class="control-fb control--checkbox"> Download clip <tooltip text="'You can change which folder clips save to in the Settings tab.'"></tooltip>
                    <input type="checkbox" ng-model="effect.download">
                    <div class="control__indicator"></div>
                </label>
            </div>-->
        </eos-container>

        <div ng-if="effect.showInOverlay">
            <eos-container header="Wait for Video to Finish" class="setting-padtop">
                <firebot-checkbox label="Wait for video to finish" tooltip="Wait for the video to finish before allowing the next effect to run." model="effect.wait" />
            </eos-container>
            <eos-overlay-position effect="effect"></eos-overlay-position>
            <eos-container header="Dimensions">
                <label class="control-fb control--checkbox"> Force 16:9 Ratio
                    <input type="checkbox" ng-click="forceRatioToggle();" ng-checked="forceRatio">
                    <div class="control__indicator"></div>
                </label>
                <div class="input-group">
                    <span class="input-group-addon">Width (in pixels)</span>
                    <input
                        type="text"
                        class="form-control"
                        aria-describeby="video-width-setting-type"
                        type="number"
                        ng-change="calculateSize('Width', effect.width)"
                        ng-model="effect.width">
                    <span class="input-group-addon">Height (in pixels)</span>
                    <input
                        type="text"
                        class="form-control"
                        aria-describeby="video-height-setting-type"
                        type="number"
                        ng-change="calculateSize('Height', effect.height)"
                        ng-model="effect.height">
                </div>
            </eos-container>
            <eos-enter-exit-animations effect="effect" class="setting-padtop"></eos-enter-exit-animations>
            <eos-overlay-instance effect="effect" class="setting-padtop"></eos-overlay-instance>
        </div>

        <eos-container>
            <div class="effect-info alert alert-warning">
                Note: You must be live for this effect to work.
            </div>
        </eos-container>
    `,
    optionsController: ($scope, $q, backendCommunicator) => {

        // Force ratio toggle
        $scope.forceRatio = true;
        $scope.forceRatioToggle = function() {
            if ($scope.forceRatio === true) {
                $scope.forceRatio = false;
            } else {
                $scope.forceRatio = true;
            }
        };

        if ($scope.effect.options == null) {
            $scope.effect.options = { };
        }
        if ($scope.effect.embedColor == null) {
            $scope.effect.embedColor = "#21b9ed";
        }
        if ($scope.effect.wait == null) {
            $scope.effect.wait = true;
        }

        // Calculate 16:9
        // This checks to see which field the user is filling out, and then adjust the other field so it's always 16:9.
        $scope.calculateSize = function(widthOrHeight, size) {
            if (size !== "") {
                if (widthOrHeight === "Width" && $scope.forceRatio) {
                    $scope.effect.height = String(Math.round(size / 16 * 9));
                } else if (widthOrHeight === "Height" && $scope.forceRatio) {
                    $scope.effect.width = String(Math.round(size * 16 / 9));
                }
            } else {
                $scope.effect.height = "";
                $scope.effect.width = "";
            }
        };

        if ($scope.effect.clipDuration == null) {
            $scope.effect.clipDuration = 30;
        }

        $scope.hasChannels = false;
        $scope.channelOptions = {};
        $q.when(backendCommunicator.fireEventAsync("getDiscordChannels"))
            .then((channels) => {
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
        if (effect.postInDiscord && effect.discordChannelId == null) {
            errors.push("Please select Discord channel.");
        }
        if (effect.options.putClipUrlInVariable && !(effect.options.variableName?.length > 0)) {
            errors.push("Please enter a variable name.");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;
        const clip = await clipProcessor.createClip(effect);
        if (clip != null) {
            const clipDuration = clip.duration;

            if (effect.showInOverlay) {

                let position = effect.position;
                if (position === "Random") {
                    position = mediaProcessor.randomLocation();
                }

                let overlayInstance = null;
                if (SettingsManager.getSetting("UseOverlayInstances")) {
                    if (effect.overlayInstance != null) {
                        if (SettingsManager.getSetting("OverlayInstances").includes(effect.overlayInstance)) {
                            overlayInstance = effect.overlayInstance;
                        }
                    }
                }

                const { url, useIframe } = await resolveTwitchClipVideoUrl(clip);

                webServer.sendToOverlay("playTwitchClip", {
                    clipVideoUrl: url,
                    useIframe,
                    width: effect.width,
                    height: effect.height,
                    duration: clipDuration,
                    position: position,
                    customCoords: effect.customCoords,
                    enterAnimation: effect.enterAnimation,
                    enterDuration: effect.enterDuration,
                    inbetweenAnimation: effect.inbetweenAnimation,
                    inbetweenDuration: effect.inbetweenDuration,
                    inbetweenDelay: effect.inbetweenDelay,
                    inbetweenRepeat: effect.inbetweenRepeat,
                    exitAnimation: effect.exitAnimation,
                    exitDuration: effect.exitDuration,
                    overlayInstance: overlayInstance
                });

                if (effect.wait ?? true) {
                    await utils.wait(clipDuration * 1000);
                }
            }

            if (effect.options.putClipUrlInVariable) {
                customVariableManager.addCustomVariable(
                    effect.options.variableName,
                    clip.url,
                    effect.options.variableTtl || 0,
                    effect.options.variablePropertyPath || null
                );
            }
        }

        return {
            success: clip != null,
            outputs: {
                clipUrl: clip?.url ?? ""
            }
        };
    },
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: "playTwitchClip",
            onOverlayEvent: (event) => {
                const {
                    clipVideoUrl,
                    useIframe,
                    volume,
                    width,
                    height,
                    duration,
                    position,
                    customCoords,
                    enterAnimation,
                    enterDuration,
                    inbetweenAnimation,
                    inbetweenDuration,
                    inbetweenDelay,
                    inbetweenRepeat,
                    exitAnimation,
                    exitDuration,
                    rotation
                } = event;

                let videoElement;
                if (useIframe) {
                    // eslint-disable-next-line prefer-template
                    const styles = `width: ${width || screen.width}px;
                        height: ${height || screen.height}px;
                        transform: rotate(${rotation || 0});`;

                    videoElement = `
                        <iframe style="border: none; ${styles}"
                            src="${clipVideoUrl}&parent=${window.location.hostname}&autoplay=true"
                            height="${height || screen.height}"
                            width="${width || screen.width}"
                            frameBorder=0
                            allowfullscreen>
                        </iframe>
                    `;
                } else {
                    // eslint-disable-next-line prefer-template
                    const styles = (width ? `width: ${width}px;` : '') +
                        (height ? `height: ${height}px;` : '') +
                        (rotation ? `transform: rotate(${rotation});` : '');

                    videoElement = `
                        <video autoplay
                            src="${clipVideoUrl}"
                            height="${height || ""}"
                            width="${width || ""}"
                            style="border: none;${styles}"
                            onloadstart="this.volume=${volume}"
                            allowfullscreen="false" />
                    `;
                }


                const positionData = {
                    position: position,
                    customCoords: customCoords
                };

                const animationData = {
                    enterAnimation: enterAnimation,
                    enterDuration: enterDuration,
                    inbetweenAnimation: inbetweenAnimation,
                    inbetweenDelay: inbetweenDelay,
                    inbetweenDuration: inbetweenDuration,
                    inbetweenRepeat: inbetweenRepeat,
                    exitAnimation: exitAnimation,
                    exitDuration: exitDuration,
                    totalDuration: parseFloat(duration) * 1000
                };

                showElement(videoElement, positionData, animationData); // eslint-disable-line no-undef

            }
        }
    }
};

module.exports = clip;
