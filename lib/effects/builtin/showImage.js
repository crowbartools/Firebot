"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const mediaProcessor = require("../../common/handlers/mediaProcessor");
const webServer = require("../../../server/httpServer");

const {
    EffectDefinition,
    EffectDependency,
    EffectTrigger
} = require("../models/effectModels");

/**
 * The Show Image effect
 */
const showImage = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:showImage",
        name: "Show Image/GIF",
        description: "Shows an image in the overlay.",
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
    <div class="effect-specific-title"><h4>Image</h4></div>
    <div class="effect-setting-content">
        <div style="padding-bottom: 10px;width: 100%;">
            <img ng-src="{{getImagePreviewSrc()}}" style="height: 100px;width: 175px;object-fit: scale-down;background: #d7d7d7">
        </div>
        <div class="controls-fb-inline" style="padding-bottom: 5px;">
            <label class="control-fb control--radio">Local file
                <input type="radio" ng-model="effect.imageType" value="local"/> 
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">URL
                <input type="radio" ng-model="effect.imageType" value="url"/>
                <div class="control__indicator"></div>
            </label>
        </div>
        <div ng-if="effect.imageType === 'local'" style="display: flex;flex-direction: row;align-items: center;">
            <file-chooser model="effect.file" options="{ filters: [ {name: 'Image', extensions: ['jpg', 'gif', 'png', 'jpeg']} ]}"></file-chooser>
        </div>
        <div ng-if="effect.imageType === 'url'">
            <input type="text" class="form-control" ng-model="effect.url" placeholder="Enter url">
        </div>
    </div>
    </div>
    <eos-overlay-position effect="effect" class="setting-padtop"></eos-overlay-position>
    <eos-enter-exit-animations effect="effect" class="setting-padtop"></eos-enter-exit-animations>
    <div class="effect-setting-container setting-padtop">
    <div class="effect-specific-title"><h4>Dimensions</h4></div>
    <div class="effect-setting-content">
        <div class="input-group">
            <span class="input-group-addon">Width</span>
            <input 
                type="number" 
                class="form-control" 
                aria-describeby="image-width-setting-type" 
                type="number"
                ng-model="effect.width"
                placeholder="px">
            <span class="input-group-addon">Height</span>
            <input 
                type="number" 
                class="form-control" 
                aria-describeby="image-height-setting-type" 
                type="number"
                ng-model="effect.height"
                placeholder="px">
        </div>
    </div>
    </div>
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
    <eos-overlay-instance effect="effect" class="setting-padtop"></eos-overlay-instance>
    <div class="effect-info alert alert-warning">
    This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal()" style="text-decoration:underline">Learn more</a>
    </div>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, utilityService) => {
        if ($scope.effect.imageType == null) {
            $scope.effect.imageType = "local";
        }

        $scope.showOverlayInfoModal = function(overlayInstance) {
            utilityService.showOverlayInfoModal(overlayInstance);
        };

        $scope.getImagePreviewSrc = function() {
            let path;
            if ($scope.effect.imageType === "local") {
                path = $scope.effect.file;
            } else {
                path = $scope.effect.url;
            }

            if (path == null || path === "") {
                path = "../images/placeholders/image.png";
            }

            return path;
        };
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.imageType == null) {
            errors.push("Please select an image type.");
        }
        if (effect.file == null && effect.file == null) {
            errors.push("Please select an image source, either file path or url.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise((resolve, reject) => {
            // What should this do when triggered.
            let effect = event.effect;

            let position = effect.position;
            if (position === "Random") {
                position = mediaProcessor.randomLocation();
            }

            let data = {
                filepath: effect.file,
                url: effect.url,
                imageType: effect.imageType,
                imagePosition: position,
                imageHeight: effect.height ? effect.height + "px" : "auto",
                imageWidth: effect.width ? effect.width + "px" : "auto",
                imageDuration: effect.length,
                enterAnimation: effect.enterAnimation,
                exitAnimation: effect.exitAnimation,
                customCoords: effect.customCoords
            };

            if (settings.useOverlayInstances()) {
                if (effect.overlayInstance != null) {
                    if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
                        data.overlayInstance = effect.overlayInstance;
                    }
                }
            }

            if (effect.imageType == null) {
                effect.imageType = "local";
            }

            if (effect.imageType === "local") {
                let resourceToken = resourceTokenManager.storeResourcePath(
                    effect.file,
                    effect.length
                );
                data.resourceToken = resourceToken;
            }

            webServer.sendToOverlay("image", data);
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
            name: "image",
            onOverlayEvent: event => {
                console.log("yay show image");
                // Image Handling
                // This will take the data that is sent to it from the GUI and render an image on the overlay.
                let data = event;

                // Image Packet...
                // {"event":"image","filepath":filepath, "imageX":imageX, "imageY":imageY, "imageDuration":imageDuration};
                let filepath = data.filepath;
                let imagePosition = data.imagePosition;
                let imageHeight = data.imageHeight;
                let imageWidth = data.imageWidth;

                let imageDuration = parseFloat(data.imageDuration) * 1000;

                let customPosStyles = "";
                if (imagePosition === "Custom") {
                    customPosStyles = getStylesForCustomCoords(data.customCoords); //eslint-disable-line no-undef
                }

                let filepathNew;
                if (data.imageType === "url") {
                    filepathNew = data.url;
                } else {
                    let token = encodeURIComponent(data.resourceToken);
                    filepathNew = `http://${
                        window.location.hostname
                    }:7472/resource/${token}`;
                }

                // Get time in milliseconds to use as class name.
                let d = new Date();
                let divClass = d.getTime();
                let imageFinal = "";

                if (imageHeight === false && imageWidth === false) {
                    // Both height and width fields left blank.
                    imageFinal =
            '<div class="' +
            divClass +
            '-image imageOverlay" position="' +
            imagePosition +
            '" style="display:block;' +
            customPosStyles +
            '"><img src="' +
            filepathNew +
            "?time=" +
            divClass +
            '"style="' +
            customPosStyles +
            '"></div>';
                } else if (imageWidth === false) {
                    // Width field left blank, but height provided.
                    imageFinal =
            '<div class="' +
            divClass +
            '-image imageOverlay" position="' +
            imagePosition +
            '" style="display:block;height:' +
            imageHeight +
            ";" +
            customPosStyles +
            '"><img src="' +
            filepathNew +
            "?time=" +
            divClass +
            '"style="max-width:100%; max-height:100%;height:' +
            imageHeight +
            ";" +
            customPosStyles +
            '"></div>';
                } else if (imageHeight === false) {
                    // Height field left blank, but width provided.
                    imageFinal =
            '<div class="' +
            divClass +
            '-image imageOverlay" style="width:100%;height:100%;position:relative;' +
            customPosStyles +
            '"><img src="' +
            filepathNew +
            "?time=" +
            divClass +
            '" style="max-width:100%; max-height:100%;width:' +
            imageWidth +
            ";" +
            customPosStyles +
            '"></div>';
                } else {
                    // Both height and width provided.
                    imageFinal =
            '<div class="' +
            divClass +
            '-image imageOverlay" position="' +
            imagePosition +
            '" style="display:block;height:' +
            imageHeight +
            "; width:" +
            imageWidth +
            ";" +
            customPosStyles +
            '"><img src="' +
            filepathNew +
            "?time=" +
            divClass +
            '" style="max-width:100%; max-height:100%;' +
            customPosStyles +
            '"></div>';
                }

                $("#wrapper").append(imageFinal);
                showTimedAnimatedElement( //eslint-disable-line no-undef
                    divClass + "-image",
                    data.enterAnimation,
                    data.exitAnimation,
                    imageDuration,
                    data.resourceToken
                );
            }
        }
    }
};

module.exports = showImage;
