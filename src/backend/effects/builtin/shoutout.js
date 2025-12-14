"use strict";

const { SettingsManager } = require("../../common/settings-manager");
const mediaProcessor = require("../../common/handlers/mediaProcessor");
const webServer = require("../../../server/http-server-manager");
const { TwitchApi } = require("../../streaming-platforms/twitch/api");
const { EffectCategory } = require('../../../shared/effect-constants');
const logger = require("../../logwrapper");
const { wait } = require("../../utils");

const shoutoutStyles = `
    .firebot-shoutout-wrapper {
        font-family: 'Inter', 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: black;
        border-radius: 1.2vw;
        width: 19vw;
        position: relative;
        padding-top: 63%;
        margin-top: 32%;
        box-shadow: 0 0.8vw 2.4vw rgba(0, 0, 0, 0.4),
                    0 0.3vw 0.8vw rgba(0, 0, 0, 0.3),
                    0 0 0 0.15vw rgba(255, 255, 255, 0.1) inset;
        backdrop-filter: blur(10px);
        opacity: 0;
    }
    .firebot-shoutout-padding {
        padding: 0 5%;
    }
    .firebot-shoutout-avatar-wrapper {
        position: absolute;
        bottom: 64%;
        left: 0;
        width: 90%;
        filter: drop-shadow(0 0.5vw 1.5vw rgba(0, 0, 0, 0.5));
        opacity: 0;
        z-index: 1;
    }
    .firebot-shoutout-user-avatar {
        width: 100%;
        border-radius: 100%;
        background: black;
        object-fit: cover;
        border: none;
        box-shadow: 0 0 0 0.15vw rgba(0, 0, 0, 0.3),
                    0 0 2vw rgba(255, 255, 255, 0.1) inset;
    }
    .firebot-shoutout-username {
        font-size: 27px;
        color: white;
        text-align: center;
        font-weight: 900;
        word-break: break-all;
        letter-spacing: 0.05em;
        text-shadow: 0 0.2vw 0.8vw rgba(0, 0, 0, 0.1),
                     0 0.1vw 0.3vw rgba(0, 0, 0, 0.1);
        opacity: 0;
    }
    .firebot-shoutout-text {
        text-align: center;
        color: white;
        font-weight: 400;
        font-size: 1.5vw;
        margin-top: 27px;
        padding-bottom: 25px;
        line-height: 1.5;
        text-shadow: 0 0.15vw 0.5vw rgba(0, 0, 0, 0.1);
        opacity: 0;
    }
    .firebot-shoutout-game-wrapper {
        position: relative;
        border-radius: 1.2vw;
        overflow: hidden;
        border-top-right-radius: 0;
        border-top-left-radius: 0;
        opacity: 0;
    }
    .firebot-shoutout-game-boxart {
        filter: blur(1.5px);
        -webkit-filter: blur(1.5px);
        opacity: 1;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: -2;
        background-size: cover;
        background-position: center;
    }
    .firebot-shoutout-game-dimmer {
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%);
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: -1;
    }
    .firebot-shoutout-game-text-wrapper {
        width: 100%;
        height: 100%;
        padding: 5% 3%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 1.6vw;
        font-weight: 500;
        text-shadow: 0 0.2vw 0.6vw rgba(0, 0, 0, 0.1),
                     0 0.1vw 0.2vw rgba(0, 0, 0, 0.1);
        flex-direction: column;
        gap: 0.3vw;
        line-height: 1.3;
    }
    .firebot-shoutout-game-lastseen {
        font-weight: 700;
        font-size: 1vw;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        opacity: 0.9;
    }
`;

const effect = {
    definition: {
        id: "firebot:shoutout",
        name: "Firebot Shoutout",
        description: "Display a shoutout graphic for a channel in the overlay.",
        icon: "fad fa-megaphone",
        categories: [EffectCategory.COMMON, EffectCategory.FUN, EffectCategory.OVERLAY],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Preview">
            <style>${shoutoutStyles}</style>
            <div style="display:flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                <div>
                    <div
                        class="firebot-shoutout-wrapper"
                        style="width: 300px;background: linear-gradient(0deg, {{effect.bgColor2}} 0%, {{effect.bgColor1}} 100%); opacity: 1;"
                        >
                        <div style="position:relative;width:initial;">
                            <div class="firebot-shoutout-avatar-wrapper firebot-shoutout-padding" style="width: 100%; opacity: 1;">
                                <img
                                    class="firebot-shoutout-user-avatar"
                                    src="{{defaultAvatar}}"/>
                            </div>
                        </div>
                        <div class="firebot-shoutout-username" style="padding: 0 10%; color: {{effect.textColor}};font-size: 32px; opacity: 1;">SomeUser</div>
                        <div class="firebot-shoutout-padding">
                            <div
                                ng-hide="effect.shoutoutText == null || effect.shoutoutText === ''"
                                class="firebot-shoutout-text"
                                style="color: {{effect.textColor}}; opacity: 1;">
                                {{effect.shoutoutText}}
                            </div>
                        </div>
                        <div ng-if="effect.showLastGame" class="firebot-shoutout-game-wrapper" style="opacity: 1;">
                            <div class="firebot-shoutout-game-boxart" ng-if="!effect.hideCategoryArt" style="background-image:url('{{defaultGameBoxArt}}');" />
                            <div class="firebot-shoutout-game-dimmer" />
                            <div class="firebot-shoutout-game-text-wrapper">
                                <div class="firebot-shoutout-game-lastseen">
                                {{effect.lastGameText}}
                                </div>
                                Science & Technology
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </eos-container>
        <eos-container header="Customization" pad-top="true">
            <firebot-input input-title="Shoutout Text" model="effect.shoutoutText" placeholder-text="Enter text" />

            <color-picker-input style="margin-top:10px" model="effect.bgColor1" label="Background Color 1"></color-picker-input>

            <color-picker-input style="margin-top:10px" model="effect.bgColor2" label="Background Color 2"></color-picker-input>

            <color-picker-input style="margin-top:10px" model="effect.textColor" label="Text Color"></color-picker-input>

            <firebot-input style="margin-top:10px" input-title="Scale" model="effect.scale" placeholder-text="Enter number (ie 1, 1.25, 0.75, etc)" input-type="number" disable-variables="true" />

            <div style="padding-top:20px">
                <firebot-checkbox
                    label="Show last game/category"
                    model="effect.showLastGame"
                />
                <firebot-checkbox
                    ng-if="effect.showLastGame"
                    label="Hide game/category art"
                    model="effect.hideCategoryArt"
                />
            </div>

            <firebot-input ng-if="effect.showLastGame" input-title="Last Seen Text" model="effect.lastGameText" placeholder-text="Enter text" />

        </eos-container>
        <eos-container header="Username" pad-top="true">
            <firebot-input model="effect.username" placeholder-text="Enter username" />
            <p ng-show="trigger == 'command'" class="muted" style="font-size:11px;margin-top:6px;">
                <b>ProTip:</b> Use <b>$target</b> to display the targeted user in a command.
            </p>
        </eos-container>
        <eos-container header="Duration" pad-top="true">
            <firebot-input input-title="Secs" model="effect.duration" placeholder-text="Enter duration" input-type="number" />
            <p class="muted" style="font-size:11px;margin-top:6px;">
                <b>Note:</b> The total duration will be an additional 4 seconds (2 second enter animation, 2 second exit animation)
            </p>
            <div style="padding-top:20px">
                <label class="control-fb control--checkbox"> Wait for shoutout to finish <tooltip text="'Wait for the shoutout to finish before letting the next effect play.'"></tooltip>
                    <input type="checkbox" ng-model="effect.waitForShoutout">
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>
        <eos-overlay-position effect="effect" class="setting-padtop"></eos-overlay-position>
        <eos-overlay-instance effect="effect" class="setting-padtop"></eos-overlay-instance>
        <eos-container>
            <div class="effect-info alert alert-warning">
                This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal()" style="text-decoration:underline">Learn more</a>
            </div>
        </eos-container>
    `,
    optionsController: ($scope, utilityService) => {

        $scope.defaultAvatar = "https://static-cdn.jtvnw.net/jtv_user_pictures/5545fe76-a341-4ffb-bc79-7ca8075588a1-profile_image-300x300.png";
        $scope.defaultGameBoxArt = "https://static-cdn.jtvnw.net/ttv-boxart/Science%20&%20Technology.jpg";

        if ($scope.effect.shoutoutText == null) {
            $scope.effect.shoutoutText = "They are an amazing streamer. Go give them a follow!";
        }

        if ($scope.effect.showLastGame == null) {
            $scope.effect.showLastGame = true;
        }

        if ($scope.effect.bgColor1 == null) {
            $scope.effect.bgColor1 = "#046caa";
        }

        if ($scope.effect.bgColor2 == null) {
            $scope.effect.bgColor2 = "#0889d6";
        }

        if ($scope.effect.textColor == null) {
            $scope.effect.textColor = "#ffffff";
        }

        if ($scope.effect.duration == null) {
            $scope.effect.duration = 8;
        }

        if ($scope.effect.position == null) {
            $scope.effect.position = "Middle Right";
        }

        if ($scope.effect.scale == null) {
            $scope.effect.scale = 1.0;
        }

        if ($scope.effect.lastGameText == null) {
            $scope.effect.lastGameText = "Last seen streaming";
        }

        $scope.showOverlayInfoModal = function (overlayInstance) {
            utilityService.showOverlayInfoModal(overlayInstance);
        };
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.username == null || effect.username === "") {
            errors.push("Please provide a username.");
        }
        return errors;
    },
    getDefaultLabel: (effect) => {
        return effect.username;
    },
    onTriggerEvent: async (event) => {
        // What should this do when triggered.
        const { effect } = event;

        if (effect.position === "Random") {
            effect.position = mediaProcessor.randomLocation();
        }

        if (SettingsManager.getSetting("UseOverlayInstances")) {
            if (effect.overlayInstance != null) {
                if (!SettingsManager.getSetting("OverlayInstances").includes(effect.overlayInstance)) {
                    effect.overlayInstance = null;
                }
            }
        }

        const user = await TwitchApi.users.getUserByName(effect.username);

        if (user == null) {
            return;
        }

        effect.username = user.displayName;

        const channelInfo = await TwitchApi.channels.getChannelInformation(user.id);
        if (channelInfo == null) {
            return;
        }

        effect.avatarUrl = user.profilePictureUrl;

        if (effect.showLastGame) {
            try {
                const game = await TwitchApi.categories.getCategoryById(channelInfo.gameId);
                effect.gameName = channelInfo.gameName != null && channelInfo.gameName !== "" ? channelInfo.gameName : null;
                effect.gameBoxArtUrl = game.boxArtUrl;
            } catch (error) {
                logger.debug(`Failed to find game for ${user.displayName}`, error);
                effect.showLastGame = false;
            }
        }

        webServer.sendToOverlay("shoutout", effect);
        if (effect.waitForShoutout) {
            const durationInMils = (Math.round(effect.duration + 2) || 0) * 1000;
            await wait(durationInMils);
        }
        return true;
    },
    overlayExtension: {
        dependencies: {
            css: [],
            globalStyles: shoutoutStyles,
            js: []
        },
        event: {
            name: "shoutout",
            onOverlayEvent: (event) => {

                const data = event;

                const positionData = {
                    position: data.position,
                    customCoords: data.customCoords
                };

                const scale = data.scale == null ? 1.0 : data.scale;

                // eslint-disable-next-line no-undef
                const uniqueId = uuid();

                const fittyId = `fit-text-${uniqueId}`;
                const wrapperId = `shoutout-wrapper-${uniqueId}`;
                const avatarWrapperId = `avatar-wrapper-${uniqueId}`;
                const usernameId = `username-${uniqueId}`;
                const textId = `shoutout-text-${uniqueId}`;
                const gameWrapperId = `game-wrapper-${uniqueId}`;
                const boxArtId = `box-art-${uniqueId}`;

                const shoutoutElement = `
                <div style="scale: ${scale};">
                    <div id="${wrapperId}" class="firebot-shoutout-wrapper" style="background: linear-gradient(135deg, ${data.bgColor1} 0%, ${data.bgColor2} 100%);${data.zIndex ? ` position: relative; z-index: ${data.zIndex};` : ''}">

                        <div style="position:relative;">
                            <div id="${avatarWrapperId}" class="firebot-shoutout-avatar-wrapper firebot-shoutout-padding">
                                <img
                                class="firebot-shoutout-user-avatar"
                                src="${data.avatarUrl}" />
                            </div>
                        </div>
                        <div style="padding: 0 10%;">
                            <div>
                                <div>
                                    <div id="${fittyId}" class="firebot-shoutout-username ${usernameId}" style="color: ${data.textColor}">${data.username}</div>
                                </div>
                            </div>
                        </div>
                        <div id="${textId}" class="firebot-shoutout-text firebot-shoutout-padding" style="color: ${data.textColor};display:${data.shoutoutText == null || data.shoutoutText === '' ? 'none' : 'inherit'};">
                            ${data.shoutoutText}
                        </div>

                        <div id="${gameWrapperId}" class="firebot-shoutout-game-wrapper" style="display:${!data.showLastGame || data.gameName == null ? 'none' : 'inherit'};">
                            <div id="${boxArtId}" class="firebot-shoutout-game-boxart" style="background-image:url('${data.gameBoxArtUrl}');display:${data.hideCategoryArt ? 'none' : 'block'};"></div>
                            <div class="firebot-shoutout-game-dimmer" />
                            <div class="firebot-shoutout-game-text-wrapper">
                                <div class="firebot-shoutout-game-lastseen">
                                    ${data.lastGameText || "LAST SEEN STREAMING"}
                                </div>
                                ${data.gameName}
                            </div>
                        </div>
                    </div>
                </div>
                `;

                // eslint-disable-next-line no-undef
                const positionWrappedHtml = getPositionWrappedHTML(uniqueId, positionData, shoutoutElement);

                $('.wrapper').append(positionWrappedHtml);

                let fittyObj;
                setTimeout(() => {
                    // eslint-disable-next-line no-undef
                    fittyObj = fitty(`#${fittyId}`);
                }, 100);

                const entranceSequence = [
                    // 1. Card fades and scales in
                    [
                        `#${wrapperId}`,
                        { opacity: [0, 1], scale: [0, 1] },
                        { type: "spring", bounce: 0.5 }
                    ],
                    // 2. Avatar drops in
                    [
                        `#${avatarWrapperId}`,
                        { opacity: [0, 1], scale: [2, 1] },
                        { type: "spring", bounce: 0.5, at: 0.4 }
                    ],
                    // 3. Username fades in
                    [
                        `.${usernameId}`,
                        { opacity: [0, 1] },
                        { duration: 0.4, ease: "easeOut", at: 0.6 }
                    ],
                    // 4. Text content fades in
                    [
                        `#${textId}`,
                        { opacity: [0, 1] },
                        { duration: 0.4, ease: "easeOut", at: 0.8 }
                    ]
                ];

                // Add game wrapper animation if it should be shown
                if (data.showLastGame && data.gameName != null) {
                    entranceSequence.push([
                        `#${gameWrapperId}`,
                        { opacity: [0, 1] },
                        { duration: 0.4, ease: "easeOut", at: 1 }
                    ]);
                }

                // eslint-disable-next-line no-undef
                const entranceAnimation = Motion.animate(entranceSequence);

                // Start avatar floating animation after entrance completes
                entranceAnimation.then(() => {
                    // eslint-disable-next-line no-undef
                    Motion.animate(
                        `#${avatarWrapperId}`,
                        { y: [0, '-0.5vw', 0] },
                        { duration: 3, ease: "easeInOut", repeat: Infinity }
                    );
                });

                const mils = data.duration * 1000;

                setTimeout(() => {
                    // eslint-disable-next-line no-undef
                    Motion.animate(
                        `#${wrapperId}`,
                        { opacity: 0, scale: 0 },
                        { type: "spring", bounce: 0.5 }
                    ).then(() => {
                        $(`#${uniqueId}`).remove();
                        if (fittyObj && fittyObj[0]) {
                            fittyObj[0].unsubscribe();
                        }
                    });
                }, mils && mils > 0 ? mils : 8000);
            }
        }
    }
};

module.exports = effect;
