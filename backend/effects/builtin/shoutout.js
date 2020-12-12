"use strict";

const { settings } = require("../../common/settings-access");
const mediaProcessor = require("../../common/handlers/mediaProcessor");
const webServer = require("../../../server/httpServer");
const effectModels = require("../models/effectModels");
const { EffectDependency } = effectModels;
const logger = require("../../logwrapper");
const twitchApi = require("../../twitch-api/api");

const { EffectCategory } = require('../../../shared/effect-constants');
const { DatabaseError } = require("node-json-db/lib/Errors");

const shoutoutStyles = `
    .firebot-shoutout-wrapper {
        font-family: 'Roboto';
        padding: 15px;
        background: black;
        border-radius: 15px; 
        width: 270px;
        position: relative;
        padding-top: 175px;
        margin-top: 75px;
    }
    .firebot-shoutout-user-avatar {
        width: 240px;
        height: 240px;
        border-radius: 100%;
        position: absolute;
        top: -75px;
        left: 30px;
        background: black;
        object-fit: cover;
    }
    .firebot-shoutout-username {
        font-size: 27px; 
        color: white;
        text-align: center;
        font-weight: 200;
        word-break: break-all;
    }
    .firebot-shoutout-text {
        text-align: center;
        color: white;
        font-weight: 400;
        font-size: 24px;
        margin-top: 27px;
    }
    .firebot-shoutout-game-wrapper {
        transform: scale(1.113) translateY(11px);
        position: relative;
        border-radius: 15px;
        overflow: hidden;
        margin-top: 25px;
        border-top-right-radius: 0; 
        border-top-left-radius: 0;
    }
    .firebot-shoutout-game-boxart {
        filter: blur(1px);
        -webkit-filter: blur(1px);
        opacity: 1;
        width: 100%;
        height: 100%;
        position: absolute;
        top:0;
        left:0;
        z-index:-2;
        background-size: cover;
        background-position: center;
    }
    .firebot-shoutout-game-dimmer {
        background: rgba(0, 0, 0, 0.25);
        width: 100%;
        height: 100%;
        position: absolute;
        top:0;
        left:0;
        z-index:-1;
    }
    .firebot-shoutout-game-text-wrapper {
        width: 100%;
        height: 100%;
        padding: 10px 0;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 22px;
        font-weight: 400;
        text-shadow: 0px 0px 5px #000000;
        flex-direction: column;
    }
    .firebot-shoutout-game-lastseen {
        font-weight: 600;
        font-size: 15px;
        text-align: center;
    }
`;

const effect = {
    definition: {
        id: "firebot:shoutout",
        name: "Show Shoutout",
        description: "Shows an shoutout graphic for a user in the overlay.",
        icon: "fad fa-megaphone",
        categories: [EffectCategory.COMMON, EffectCategory.FUN, EffectCategory.OVERLAY],
        dependencies: [EffectDependency.OVERLAY]
    },
    optionsTemplate: `
        <eos-container header="Preview">
            <style>${shoutoutStyles}</style>
            <div style="display:flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                <div 
                    class="firebot-shoutout-wrapper"
                    style="width: 300px;background: linear-gradient(0deg, {{effect.bgColor2}} 0%, {{effect.bgColor1}} 100%);"
                    >
                    <img 
                        class="firebot-shoutout-user-avatar"
                        src="{{defaultAvatar}}"/>
                    <div class="firebot-shoutout-username" style="color: {{effect.textColor}};font-size: 37px;">SomeUserName</div>
                    <div 
                        ng-hide="effect.shoutoutText == null || effect.shoutoutText === ''" 
                        class="firebot-shoutout-text"
                        style="color: {{effect.textColor}};">
                        {{effect.shoutoutText}}
                    </div>
                    
                    <div ng-if="effect.showLastGame" class="firebot-shoutout-game-wrapper" style="transform: scale(1.13) translateY(10px);">
                        <div class="firebot-shoutout-game-boxart" style="background-image:url('{{defaultGameBoxArt}}');" />
                        <div class="firebot-shoutout-game-dimmer" />
                        <div class="firebot-shoutout-game-text-wrapper">
                            <div class="firebot-shoutout-game-lastseen">
                                LAST SEEN PLAYING
                            </div>
                            Science & Technology
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

            <div style="padding-top:20px">
                <label class="control-fb control--checkbox"> Show last game
                    <input type="checkbox" ng-model="effect.showLastGame">
                    <div class="control__indicator"></div>
                </label>
            </div>
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

        $scope.defaultAvatar = "https://cdn.akc.org/content/hero/puppy_pictures_header.jpg";
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

        $scope.showOverlayInfoModal = function(overlayInstance) {
            utilityService.showOverlayInfoModal(overlayInstance);
        };
    },
    optionsValidator: effect => {
        let errors = [];
        if (effect.username == null || effect.username === "") {
            errors.push("Please provide a username.");
        }
        return errors;
    },

    onTriggerEvent: async event => {
        // What should this do when triggered.
        const { effect } = event;

        if (effect.position === "Random") {
            effect.position = mediaProcessor.randomLocation();
        }

        if (settings.useOverlayInstances()) {
            if (effect.overlayInstance != null) {
                if (!settings.getOverlayInstances().includes(effect.overlayInstance)) {
                    effect.overlayInstance = null;
                }
            }
        }

        const user = await twitchApi.getClient().helix.users
            .getUserByName(effect.username);

        if (user == null) return;

        effect.username = user.displayName;

        const channelInfo = await twitchApi.channels.getChannelInformation(user.id);
        if (channelInfo == null) return;

        const game = await twitchApi.categories.getCategoryById(channelInfo.game_id);

        effect.avatarUrl = user.profilePictureUrl;
        effect.gameName = channelInfo.game_name || "Unknown game";
        effect.gameBoxArtUrl = game.boxArtUrl;

        webServer.sendToOverlay("shoutout", effect);
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
            onOverlayEvent: event => {

                const data = event;

                const positionData = {
                    position: data.position,
                    customCoords: data.customCoords
                };

                const uniqueId = new Date().getTime();

                const fittyId = `fit-text-${uniqueId}`;

                const shoutoutElement = `
                    <div class="animated flipInY firebot-shoutout-wrapper" style="background: linear-gradient(0deg, ${data.bgColor2} 0%, ${data.bgColor1} 100%);">
                        <img 
                            class="firebot-shoutout-user-avatar"
                            src="${data.avatarUrl}"/>
                        <div>
                            <div id="${fittyId}" class="firebot-shoutout-username" style="color: ${data.textColor}">${data.username}</div>
                        </div>
                        <div class="firebot-shoutout-text" style="color: ${data.textColor};display:${data.shoutoutText == null || data.shoutoutText === '' ? 'none' : 'inherit'};">
                            ${data.shoutoutText}
                        </div>
                        
                        <div class="firebot-shoutout-game-wrapper" style="display:${!data.showLastGame ? 'none' : 'inherit'};">
                            <div class="firebot-shoutout-game-boxart" style="background-image:url('${data.gameBoxArtUrl}');"></div>
                            <div class="firebot-shoutout-game-dimmer" />
                            <div class="firebot-shoutout-game-text-wrapper">
                                <div class="firebot-shoutout-game-lastseen">
                                    LAST SEEN PLAYING
                                </div>
                                ${data.gameName}
                            </div>
                        </div>
                    </div>
                `;

                // eslint-disable-next-line no-undef
                let positionWrappedHtml = getPositionWrappedHTML(uniqueId, positionData, shoutoutElement);

                $('.wrapper').append(positionWrappedHtml);

                // eslint-disable-next-line no-undef
                const fittyObj = fitty(`#${fittyId}`);

                const mils = data.duration * 1000;

                // eslint-disable-next-line no-undef
                showTimedAnimatedElement(
                    "#" + uniqueId,
                    "flipInY",
                    2000,
                    null,
                    null,
                    null,
                    null,
                    "bounceOut",
                    2000,
                    mils && mils > 0 ? mils : 8000,
                    null,
                    () => {
                        if (fittyObj && fittyObj[0]) {
                            fittyObj[0].unsubscribe();
                        }
                    }
                );
            }
        }
    }
};

module.exports = effect;
