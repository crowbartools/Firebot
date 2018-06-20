"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const mediaProcessor = require("../../common/handlers/mediaProcessor");

const {
  EffectDefinition,
  EffectDependency,
  EffectTrigger
} = require("../models/effectModels");

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
    tags: ["Fun", "Built in"],
    dependencies: [EffectDependency.OVERLAY],
    triggers: [EffectTrigger.ALL]
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
    <div class="effect-setting-container">
    <div class="effect-specific-title"><h4>What type of video do you want to display?</h4></div>
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
        <span class="input-group-addon">YouTube ID</span>
        <input 
            type="text" 
            class="form-control" 
            aria-describeby="video-youtube-setting-type" 
            type="text"
            ng-model="effect.youtube"
            placeholder="Ex: AAYrZ69XA8c">
    </div>
    </div>
    <div ng-show="effect.videoType">
    <eos-overlay-position effect="effect"></eos-overlay-position>
    <div class="effect-setting-container">
        <div class="effect-specific-title">
        <h4 style="display:inline-block;margin-right:20px;">How big should it be?</h4>
        <label class="control-fb control--checkbox" style="display:inline;"> Force 16:9 Ratio
            <input type="checkbox" ng-click="forceRatioToggle();" ng-checked="forceRatio">
            <div class="control__indicator"></div>
        </label>
        </div>
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
    </div>
    <eos-enter-exit-animations effect="effect"></eos-enter-exit-animations>
    <div class="effect-setting-container">
        <div ng-show="effect.videoType == 'YouTube Video'">
            <div class="effect-specific-title"><h4>Start position in video?</h4></div>
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
        </div>
        <div class="effect-specific-title"><h4>How long should it show?</h4></div>
        <div class="input-group">
            <span class="input-group-addon">Seconds</span>
            <input 
            type="text" 
            class="form-control" 
            aria-describedby="video-length-effect-type" 
            type="number"
            ng-model="effect.length">
        </div>
        <label class="control-fb control--checkbox" style="margin-top:15px;"> Loop <tooltip text="'Loop the video until the duration is reached.'"></tooltip>
        <input type="checkbox" ng-model="effect.loop">
        <div class="control__indicator"></div>
        </label>
    </div>
    <div class="effect-specific-title"><h4>How loud should it be?</h4></div>
    <div class="volume-slider-wrapper">
        <i class="fal fa-volume-down volume-low"></i>
        <rzslider rz-slider-model="effect.volume" rz-slider-options="{floor: 1, ceil: 10, hideLimitLabels: true}"></rzslider>
        <i class="fal fa-volume-up volume-high"></i>
    </div>
    <eos-overlay-instance effect="effect"></eos-overlay-instance>
    <div class="effect-info alert alert-warning">
        This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal(effect.overlayInstance)" style="text-decoration:underline">Learn more</a>
    </div>
    </div>
    `,
  /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
  optionsController: ($scope, listenerService, utilityService) => {
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

    let uuid = _.uniqueId();

    $scope.setVideoType = function(type) {
      $scope.effect.videoType = type;
      $scope.effect.youtube = "";
      $scope.effect.file = "";
    };

    $scope.openFileExporer = function() {
      let registerRequest = {
        type: listenerService.ListenerType.VIDEO_FILE,
        uuid: uuid,
        runOnce: true,
        publishEvent: true
      };
      listenerService.registerListener(registerRequest, filepath => {
        $scope.effect.file = filepath;
      });
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
  onTriggerEvent: event => {
    return new Promise((resolve, reject) => {
      // What should this do when triggered.
      mediaProcessor.video(event.effect);
      resolve(true);
    });
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
      name: "playvideo",
      onOverlayEvent: event => {
        console.log("yay play video");
        //need to implement this
      }
    }
  }
};

module.exports = playVideo;
