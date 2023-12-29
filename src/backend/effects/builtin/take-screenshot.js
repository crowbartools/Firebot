"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');
const { settings } = require("../../common/settings-access");
const mediaProcessor = require("../../common/handlers/mediaProcessor");
const webServer = require("../../../server/http-server-manager");
const path = require("path");
const discordEmbedBuilder = require("../../integrations/builtin/discord/discord-embed-builder");
const discord = require("../../integrations/builtin/discord/discord-message-sender");

const sanitizeFileName = require("sanitize-filename");
const fs = require("fs/promises");
const logger = require('../../logwrapper');

const clip = {
    definition: {
        id: "firebot:screenshot",
        name: "Take Screenshot",
        description: "Takes a screenshot of the selected screen.",
        icon: "fad fa-camera",
        categories: [EffectCategory.FUN],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
       <eos-container header="Display">
            <dropdown-select options="displayOptions" selected="effect.displayId"></dropdown-select>
       </eos-container>

        <eos-container header="Options" pad-top="true">
            <div style="padding-top:15px">
                <label class="control-fb control--checkbox"> Save screenshot to folder
                    <input type="checkbox" ng-model="effect.saveLocally">
                    <div class="control__indicator"></div>
                </label>
                <div ng-if="effect.saveLocally" style="margin-left: 30px;">
                    <file-chooser model="effect.folderPath" options="{ directoryOnly: true, filters: [], title: 'Select Screenshot Folder'}"></file-chooser>
                </div>
            </div>

            <div style="padding-top:15px" ng-show="hasChannels">
                <label class="control-fb control--checkbox"> Post screenshot in Discord channel
                    <input type="checkbox" ng-model="effect.postInDiscord">
                    <div class="control__indicator"></div>
                </label>
            </div>
            <div ng-show="effect.postInDiscord" style="margin-left: 30px;">
                <div>Discord Channel:</div>
                <dropdown-select options="channelOptions" selected="effect.discordChannelId"></dropdown-select>
            </div>

            <div style="padding-top:15px">
                <label class="control-fb control--checkbox"> Show screenshot in overlay
                    <input type="checkbox" ng-model="effect.showInOverlay">
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <div ng-if="effect.showInOverlay">
            <eos-container header="Overlay Duration" pad-top="true">
                <firebot-input model="effect.duration" input-type="number" disable-variables="true" input-title="Secs" />
            </eos-container>
            <eos-container header="Overlay Dimensions" pad-top="true">
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
            <eos-overlay-position effect="effect" class="setting-padtop"></eos-overlay-position>
            <eos-enter-exit-animations effect="effect" class="setting-padtop"></eos-enter-exit-animations>
            <eos-overlay-instance effect="effect" class="setting-padtop"></eos-overlay-instance>

        </div>
        <eos-container pad-top="true">
            <div class="effect-info alert alert-info">
                Note: Screenshots will capture the entirety of the selected display.
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

        if ($scope.effect.duration == null) {
            $scope.effect.duration = 5;
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

        const displays = backendCommunicator.fireEventSync("getAllDisplays");
        const primaryDisplay = backendCommunicator.fireEventSync("getPrimaryDisplay");

        $scope.displayOptions = displays.reduce((acc, display, i) => {
            const isPrimary = display.id === primaryDisplay.id;
            acc[display.id] = `Display ${i + 1}${isPrimary ? ` (Primary)` : ''}`;
            return acc;
        }, {});

        if ($scope.effect.displayId == null ||
            $scope.displayOptions[$scope.effect.displayId] == null) {
            $scope.effect.displayId = displays[0].id;
        }
    },
    optionsValidator: effect => {
        const errors = [];
        if (effect.postInDiscord && effect.discordChannelId == null) {
            errors.push("Please select Discord channel.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        const screenHelpers = require("../../app-management/electron/screen-helpers");
        const twitchApi = require('../../twitch-api/api');

        const { effect } = event;

        const screenshotDataUrl = await screenHelpers.takeScreenshot(effect.displayId);

        if (screenshotDataUrl != null) {

            const base64ImageData = screenshotDataUrl.split(';base64,').pop();
            if (effect.saveLocally) {
                try {
                    const { title, gameName} = await twitchApi.channels.getChannelInformation();
                    const fileName = sanitizeFileName(`${title}-${gameName}-${new Date().getTime()}`);
                    const folder = path.join(effect.folderPath, `${fileName}.png`);
                    await fs.writeFile(folder, base64ImageData, {encoding: 'base64'});
                } catch (error) {
                    logger.error("Failed to save screenshot locally", error);
                }
            }

            if (effect.postInDiscord) {
                const filename = "screenshot.png";
                const files = [{
                    file: Buffer.from(base64ImageData, 'base64'),
                    name: filename,
                    description: "Screenshot by Firebot"
                }];
                const screenshotEmbed = await discordEmbedBuilder.buildScreenshotEmbed(`attachment://${filename}`);
                await discord.sendDiscordMessage(effect.discordChannelId, "A new screenshot was taken!", screenshotEmbed, files);
            }

            if (effect.showInOverlay) {

                let position = effect.position;
                if (position === "Random") {
                    position = mediaProcessor.randomLocation();
                }

                let overlayInstance = null;
                if (settings.useOverlayInstances()) {
                    if (effect.overlayInstance != null) {
                        if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
                            overlayInstance = effect.overlayInstance;
                        }
                    }
                }

                webServer.sendToOverlay("showScreenshot", {
                    screenshotDataUrl: screenshotDataUrl,
                    width: effect.width,
                    height: effect.height,
                    duration: effect.duration || 5,
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
            }
        }

        return screenshotDataUrl != null;
    },
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: "showScreenshot",
            onOverlayEvent: event => {
                const {
                    screenshotDataUrl,
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
                    exitDuration
                } = event;

                const styles = (width ? `width: ${width}px;` : '') +
                    (height ? `height: ${height}px;` : '');

                const imageElement = `<img src="${screenshotDataUrl}" style="${styles}">`;

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

                showElement(imageElement, positionData, animationData); // eslint-disable-line no-undef
            }
        }
    }
};

module.exports = clip;
