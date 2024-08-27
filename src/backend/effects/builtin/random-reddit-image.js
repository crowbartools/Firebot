"use strict";

const redditProcessor = require("../../common/handlers/redditProcessor");
const twitchChat = require("../../chat/twitch-chat");
const mediaProcessor = require("../../common/handlers/mediaProcessor");
const settings = require("../../common/settings-access").settings;
const logger = require("../../logwrapper");
const webServer = require("../../../server/http-server-manager");
const { EffectCategory } = require('../../../shared/effect-constants');

const model = {
    definition: {
        id: "firebot:randomReddit",
        name: "Random Reddit Image",
        description: "Pulls a random image from a selected subreddit.",
        icon: "fab fa-reddit-alien",
        categories: [EffectCategory.FUN, EffectCategory.CHAT_BASED, EffectCategory.OVERLAY],
        dependencies: [],
        hidden: true
    },
    globalSettings: {},
    optionsTemplate: `
    <eos-container header="Subreddit Name">
        <div class="input-group">
            <span class="input-group-addon" id="reddit-effect-type">r/</span>
            <input ng-model="effect.reddit" type="text" class="form-control" id="reddit-setting" aria-describedby="chat-text-effect-type" placeholder="puppies">
        </div>
    </eos-container>

    <eos-container header="Output Location" pad-top="true" ng-if="effect.reddit !== null && effect.reddit !== 'Pick one'">
        <div class="controls-fb-inline" style="padding-bottom: 5px;">
            <label class="control-fb control--radio">Chat
                <input type="radio" ng-model="effect.show" value="chat"/>
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">Overlay
                <input type="radio" ng-model="effect.show" value="overlay"/>
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">Both
                <input type="radio" ng-model="effect.show" value="both"/>
                <div class="control__indicator"></div>
            </label>
        </div>
    </eos-container>

    <div class="effect-reddit-settings" ng-if="effect.show === 'chat' || effect.show ==='both'">
        <eos-chatter-select effect="effect" title="Chatter" class="setting-padtop"></eos-chatter-select>
    </div>

    <div class="effect-reddit-settings" ng-if="effect.show === 'overlay' || effect.show ==='both'">
        <div class="effect-setting-container setting-padtop">
            <div class="effect-specific-title"><h4>Duration</h4></div>
            <div class="effect-setting-content">
                <div class="input-group">
                    <span class="input-group-addon">Seconds</span>
                    <input
                    type="text"
                    class="form-control"
                    aria-describedby="image-length-effect-type"
                    type="number"
                    ng-model="effect.length">
                </div>
            </div>
        </div>

        <eos-overlay-dimensions effect="effect" pad-top="true"></eos-overlay-dimensions>

        <eos-overlay-position effect="effect" class="setting-padtop"></eos-overlay-position>

        <eos-overlay-rotation effect="effect" pad-top="true"></eos-overlay-rotation>

        <eos-enter-exit-animations effect="effect" class="setting-padtop"></eos-enter-exit-animations>

        <eos-overlay-instance effect="effect" class="setting-padtop"></eos-overlay-instance>
        <div class="effect-info alert alert-warning">
            This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal()" style="text-decoration:underline">Learn more</a>
        </div>
    </div>

    <eos-container pad-top="true">
        <div class="effect-info alert alert-danger">
        Warning: This effect pulls random images from subreddits. Highly moderated subreddits are fairly safe, but there is always the chance of naughty pictures. Just a warning!
        </div>
    </eos-container>

    `,
    optionsController: ($scope) => {

        if ($scope.effect.show == null) {
            $scope.effect.show = "chat";
        }

    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.reddit == null) {
            errors.push("Please enter a subreddit.");
        }

        if (effect.show == null) {
            errors.push("Please select a place to show the reddit image.");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        const chatter = event.effect.chatter;
        const subName = event.effect.reddit;
        const imageUrl = await redditProcessor.getRandomImage(subName);

        try {
            logger.debug(`Random Reddit: ${imageUrl}`);
            if (event.effect.show === "chat" || event.effect.show === "both") {
                await twitchChat.sendChatMessage(`Random Reddit: ${imageUrl}`, null, chatter);
            }

            if (event.effect.show === "overlay" || event.effect.show === "both") {
                // Send image to overlay.
                const position = event.effect.position !== "Random" ? event.effect.position : mediaProcessor.getRandomPresetLocation();

                const data = {
                    url: imageUrl,
                    imageType: "url",
                    imagePosition: position,
                    imageHeight: event.effect.height ? `${event.effect.height}px` : "auto",
                    imageWidth: event.effect.width ? `${event.effect.width}px` : "auto",
                    imageDuration: event.effect.length,
                    enterAnimation: event.effect.enterAnimation,
                    exitAnimation: event.effect.exitAnimation,
                    customCoords: event.effect.customCoords,
                    imageRotation: event.effect.rotation ? event.effect.rotation + event.effect.rotType : "0deg"
                };


                if (settings.useOverlayInstances()) {
                    if (event.effect.overlayInstance != null) {
                        if (
                            settings
                                .getOverlayInstances()
                                .includes(event.effect.overlayInstance)
                        ) {
                            data.overlayInstance = event.effect.overlayInstance;
                        }
                    }
                }

                // Send to overlay.
                webServer.sendToOverlay("image", data);
            }
        } catch (err) {
            renderWindow.webContents.send(
                "error",
                "There was an error sending a reddit picture."
            );
        }

        return true;
    }
};

module.exports = model;
