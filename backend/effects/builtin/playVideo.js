"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const webServer = require("../../../server/httpServer");
const mediaProcessor = require("../../common/handlers/mediaProcessor");
const { EffectDependency } = require("../models/effectModels");
const { EffectCategory } = require('../../../shared/effect-constants');

/**
 * The Play Video effect
 */
const playVideo = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:playvideo",
        name: "Play Video",
        description: "Plays a video in the overlay.",
        icon: "fad fa-video",
        categories: [EffectCategory.COMMON, EffectCategory.OVERLAY],
        dependencies: [EffectDependency.OVERLAY]
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
    <eos-container header="Video">
        <div style="padding-bottom: 10px">
            <div ng-if="shouldShowVideoPlaceholder()" >
                <img src="../images/placeholders/video.png" style="width: 350px;object-fit: scale-down;background: #d7d7d7">
            </div>
            <div ng-if="effect.videoType == 'Local Video' && !shouldShowVideoPlaceholder()">
                <video width="350" controls ng-src="{{effect.file}}">
                </video>
            </div>
            <div ng-if="effect.videoType == 'YouTube Video' && !shouldShowVideoPlaceholder()">
                <!--<ng-youtube-embed
                    video="effect.youtube"
                    color="white"
                    disablekb="true"
                    fs="false"
                    showinfo="false"
                    rel="false"
                    ivloadpolicy ="false"
                    width="350px"
                    height="197.88px"
                    modestbranding="true">
                </ng-youtube-embed>-->
            </div>
        </div>

        <div class="btn-group" style="margin-bottom: 10px;">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="change-scene-type-effect-type">{{effect.videoType ? effect.videoType : "Pick one"}}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu">
                <li ng-click="effect.reset = false">
                    <a ng-click="setVideoType('Local Video')" href>Local Video</a>
                </li>
                <li ng-click="effect.reset = true">
                    <a ng-click="setVideoType('YouTube Video')" href>YouTube Video</a>
                </li>
            </ul>
        </div>

        <div ng-show="effect.videoType == 'Local Video'" class="input-group">
            <file-chooser model="effect.file" options="{ filters: [ {name: 'Video', extensions: ['mp4', 'webm', 'ogv']} ]}"></file-chooser>
        </div>
        <div ng-show="effect.videoType == 'YouTube Video'" class="input-group">
            <span class="input-group-addon">YouTube Url/ID</span>
            <input
                type="text"
                class="form-control"
                aria-describeby="video-youtube-setting-type"
                type="text"
                ng-model="effect.youtube"
                placeholder="Ex: AAYrZ69XA8c">
        </div>
    </eos-container>

    <div ng-show="effect.videoType">

        <div ng-show="effect.videoType == 'YouTube Video'">
            <eos-container header="Start Time Position" pad-top="true">
                <div class="input-group">
                    <span class="input-group-addon">Start time location</span>
                    <input
                        type="text"
                        class="form-control"
                        aria-describeby="video-youtube-time-setting"
                        type="text"
                        ng-model="effect.starttime"
                        placeholder="Ex: 12">
                </div>
            </eos-container>
        </div>

        <eos-container header="Duration" pad-top="true">
            <div class="input-group">
                <span class="input-group-addon">Seconds</span>
                <input
                    type="text"
                    class="form-control"
                    aria-describedby="video-length-effect-type"
                    replace-variables="number"
                    ng-model="effect.length">
            </div>
            <label class="control-fb control--checkbox" style="margin-top:15px;"> Loop <tooltip text="'Loop the video until the duration is reached.'"></tooltip>
                <input type="checkbox" ng-model="effect.loop">
                <div class="control__indicator"></div>
            </label>
        </eos-container>

        <eos-container header="Volume" pad-top="true">
            <div class="volume-slider-wrapper">
                <i class="fal fa-volume-down volume-low"></i>
                <rzslider rz-slider-model="effect.volume" rz-slider-options="{floor: 1, ceil: 10, hideLimitLabels: true}"></rzslider>
                <i class="fal fa-volume-up volume-high"></i>
            </div>
        </eos-container>

        <eos-overlay-position effect="effect" pad-top="true"></eos-overlay-position>

        <eos-container header="Size" pad-top="true">
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
            <div class="effect-info alert alert-info">
                Just put numbers in the fields (ex: 250). This will set the max width/height of the video and scale it down proportionally.
            </div>
        </eos-container>

        <eos-enter-exit-animations effect="effect" pad-top="true"></eos-enter-exit-animations>

        <eos-overlay-instance effect="effect" pad-top="true"></eos-overlay-instance>

        <eos-container>
            <div class="effect-info alert alert-warning">
                This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal(effect.overlayInstance)" style="text-decoration:underline">Learn more</a>
                <br>
                <strong>NOTE</strong>: Streamlabs OBS does not support mp4 videos in their browser source. If you have mp4 videos that you want to display in SLOBS, you will need to convert them to the <strong>.webm</strong> format.
            </div>
        </eos-container>
    </div>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, $rootScope, $timeout, utilityService) => {
        $scope.showOverlayInfoModal = function(overlayInstance) {
            utilityService.showOverlayInfoModal(overlayInstance);
        };

        $scope.videoPositions = [
            "Top Left",
            "Top Middle",
            "Top Right",
            "Middle Left",
            "Middle",
            "Middle Right",
            "Bottom Left",
            "Bottom Middle",
            "Bottom Right"
        ];

        // Set Video Type
        $scope.setVideoType = function(type) {
            $scope.effect.videoType = type;
            $scope.effect.youtube = "";
            $scope.effect.file = "";

            $timeout(function() {
                $rootScope.$broadcast("rzSliderForceRender");
            }, 100);
        };

        if ($scope.effect.volume == null) {
            $scope.effect.volume = 5;
        }

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
                if (widthOrHeight === "Width" && $scope.forceRatio === true) {
                    $scope.effect.height = String(Math.round(size / 16 * 9));
                } else if (widthOrHeight === "Height" && $scope.forceRatio === true) {
                    $scope.effect.width = String(Math.round(size * 16 / 9));
                }
            } else {
                $scope.effect.height = "";
                $scope.effect.width = "";
            }
        };
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.videoType == null) {
            errors.push("Please select a video type.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        let effect = event.effect;
        // What should this do when triggered.
        let position = effect.position;
        if (position === "Random") {
            position = mediaProcessor.randomLocation();
        }

        // Send data back to media.js in the gui.
        let data = {
            videoType: effect.videoType,
            filepath: effect.file,
            youtubeId: effect.youtube,
            videoPosition: position,
            videoHeight: effect.height,
            videoWidth: effect.width,
            videoDuration: effect.length,
            videoVolume: effect.volume,
            videoStarttime: effect.starttime,
            enterAnimation: effect.enterAnimation,
            enterDuration: effect.enterDuration,
            exitAnimation: effect.exitAnimation,
            exitDuration: effect.exitDuration,
            inbetweenAnimation: effect.inbetweenAnimation,
            inbetweenDelay: effect.inbetweenDelay,
            inbetweenDuration: effect.inbetweenDuration,
            inbetweenRepeat: effect.inbetweenRepeat,
            customCoords: effect.customCoords,
            loop: effect.loop === true
        };

        if (settings.useOverlayInstances()) {
            if (effect.overlayInstance != null) {
                if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
                    data.overlayInstance = effect.overlayInstance;
                }
            }
        }

        let resourceToken = resourceTokenManager.storeResourcePath(
            effect.file,
            effect.length
        );
        data.resourceToken = resourceToken;

        webServer.sendToOverlay("video", data);
        return true;
    },
    /**
   * Code to run in the overlay
   */
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: "video",
            onOverlayEvent: event => {

                if (!startedVidCache) { // eslint-disable-line no-undef
                    startedVidCache = {}; // eslint-disable-line no-undef
                }

                function animateVideoExit(idString, animation, duration, inbetweenAnimation) {

                    if (inbetweenAnimation) {
                        $(idString).find(".inner-position").css("animation-duration", "");
                        $(idString).find(".inner-position").css("animation-delay", "");
                        $(idString).find(".inner-position").css("animation-iteration-count", "");
                        $(idString).find(".inner-position").removeClass('animated ' + inbetweenAnimation);
                    }

                    $(idString).find(".inner-position").animateCss(animation, duration, null, null, () => {
                        $(idString).remove();
                    });
                }

                // Load youtube iframe api onto page.
                //let tag = document.createElement("script");
                //tag.src = "https://www.youtube.com/iframe_api";
                //let firstScriptTag = document.getElementsByTagName("script")[0];
                //firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                let data = event;

                let videoType = data.videoType;
                let filepath = data.filepath;
                let fileExt = filepath.split('.').pop();
                if (fileExt === "ogv") {
                    fileExt = "ogg";
                }
                let youtubeId = data.youtubeId;
                let videoPosition = data.videoPosition;
                let videoHeight = data.videoHeight;
                let videoWidth = data.videoWidth;
                let videoDuration = data.videoDuration != null && data.videoDuration !== "" ? parseFloat(data.videoDuration) * 1000 : null;
                let videoVolume = data.videoVolume;
                let videoStarttime = data.videoStarttime || 0;
                let loop = data.loop;

                let token = encodeURIComponent(data.resourceToken);
                let filepathNew = `http://${window.location.hostname}:7472/resource/${token}`;


                // Get time in milliseconds to use as id
                let time = new Date().getTime();
                let videoPlayerId = `${time}-video`;

                let enterAnimation = data.enterAnimation ? data.enterAnimation : "fadeIn";
                let exitAnimation = data.exitAnimation ? data.exitAnimation : "fadeIn";
                let enterDuration = data.enterDuration;
                let exitDuration = data.exitDuration;

                let inbetweenAnimation = data.inbetweenAnimation ? data.inbetweenAnimation : "none";
                let inbetweenDuration = data.inbetweenDuration;
                let inbetweenDelay = data.inbetweenDelay;
                let inbetweenRepeat = data.inbetweenRepeat;

                let positionData = {
                    position: data.videoPosition,
                    customCoords: data.customCoords
                };

                let sizeStyles = (data.videoWidth ? `width: ${data.videoWidth}px;` : '') +
                            (data.videoHeight ? `height: ${data.videoHeight}px;` : '');

                if (videoType === "Local Video") {

                    const loopAttribute = loop ? 'loop' : '';

                    let videoElement = `
                        <video id="${videoPlayerId}" class="player" ${loopAttribute} style="display:none;${sizeStyles}">
                            <source src="${filepathNew}" type="video/${fileExt}">
                        </video>
                    `;

                    let wrapperId = new Date().getTime();
                    let wrappedHtml = getPositionWrappedHTML(wrapperId, positionData, videoElement); // eslint-disable-line no-undef

                    $('.wrapper').append(wrappedHtml);

                    // Adjust volume
                    if (isNaN(videoVolume)) {
                        videoVolume = 5;
                    }

                    videoVolume = parseInt(videoVolume) / 10;
                    $(`#${videoPlayerId}`).prop("volume", videoVolume);

                    let video = document.getElementById(videoPlayerId);
                    video.oncanplay = function() {

                        if (startedVidCache[this.id]) { // eslint-disable-line no-undef
                            return;
                        }

                        startedVidCache[this.id] = true; // eslint-disable-line no-undef

                        try {
                            video.play();
                        } catch (err) {
                            console.log(err);
                        }
                        let videoEl = $(`#${videoPlayerId}`);
                        videoEl.show();

                        $(`#${wrapperId}`).find(".inner-position")
                            .animateCss(enterAnimation, enterDuration, null, null, () => {
                                $(`#${wrapperId}`).find(".inner-position")
                                    .animateCss(inbetweenAnimation, inbetweenDuration, inbetweenDelay, inbetweenRepeat);
                            });

                        // Remove div after X time.
                        if (videoDuration) {
                            setTimeout(function() {
                                delete startedVidCache[this.id]; // eslint-disable-line no-undef
                                animateVideoExit(`#${wrapperId}`, exitAnimation, exitDuration, inbetweenAnimation);
                            }, videoDuration);
                        } else {

                            const exitVideo = () => {
                                delete startedVidCache[this.id]; // eslint-disable-line no-undef
                                animateVideoExit(`#${wrapperId}`, exitAnimation, exitDuration, inbetweenAnimation);
                            };

                            video.onended = function() {
                                exitVideo();
                            };

                            $(`#${videoPlayerId}`).on("error", function() {
                                exitVideo();
                            });
                        }
                    };

                } else {

                    let ytPlayerId = `yt-${new Date().getTime()}`;

                    let youtubeElement = `<div id="${ytPlayerId}" style="display:none;${sizeStyles}"></div>`;

                    let wrapperId = new Date().getTime();
                    let wrappedHtml = getPositionWrappedHTML(wrapperId, positionData, youtubeElement); // eslint-disable-line no-undef

                    $('.wrapper').append(wrappedHtml);


                    try {
                        const url = new URL(youtubeId);
                        if (url.hostname.includes("www.youtube.com")) {
                            for (const [key, value] of url.searchParams) {
                                if (key === "v") {
                                    youtubeId = value;
                                } else if (key === "t") {
                                    videoStarttime = value;
                                }
                            }
                        }
                        if (url.hostname.includes("youtu.be")) {
                            youtubeId = url.pathname.replace("/", "");
                            for (const [key, value] of url.searchParams) {
                                if (key === "t") {
                                    videoStarttime = value;
                                }
                            }
                        }
                    } catch (error) {
                        //failed to convert url
                    }


                    // Add iframe.

                    let playerVars = {
                        'autoplay': 1,
                        'controls': 0,
                        'start': videoStarttime,
                        'showinfo': 0,
                        'rel': 0,
                        'modestbranding': 1
                    };

                    if (loop) {
                        playerVars['loop'] = 1;
                        playerVars['playlist'] = youtubeId;
                    }

                    let ytOptions = {
                        videoId: youtubeId,
                        playerVars: playerVars,
                        events: {
                            onReady: (event) => {

                                $(`#${wrapperId}`).find(".inner-position")
                                    .animateCss(enterAnimation, enterDuration, null, null, () => {
                                        $(`#${wrapperId}`).find(".inner-position")
                                            .animateCss(inbetweenAnimation, inbetweenDuration, inbetweenDelay, inbetweenRepeat);
                                    });

                                event.target.setVolume(parseInt(videoVolume) * 10);
                                event.target.playVideo();

                                $(`#${ytPlayerId}`).show();
                            },
                            onError: (event) => {
                                console.log(event);
                            },
                            onStateChange: (event) => {
                                if (event.data === 0 && !videoDuration) {
                                    animateVideoExit(`#${wrapperId}`, exitAnimation, exitDuration, inbetweenAnimation);
                                }
                            }
                        }
                    };
                    if (data.videoHeight) {
                        ytOptions.height = data.videoHeight;
                    }
                    if (data.videoWidth) {
                        ytOptions.width = data.videoWidth;
                    }

                    let player = new YT.Player(ytPlayerId, ytOptions); // eslint-disable-line no-undef

                    // Remove div after X time.
                    if (videoDuration) {
                        setTimeout(function() {
                            animateVideoExit(`#${wrapperId}`, exitAnimation, exitDuration, inbetweenAnimation);
                        }, videoDuration);
                    }

                }
            }
        }
    }
};

module.exports = playVideo;
