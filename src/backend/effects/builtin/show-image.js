"use strict";

const { SettingsManager } = require("../../common/settings-manager");
const { ResourceTokenManager } = require("../../resource-token-manager");
const mediaProcessor = require("../../common/handlers/mediaProcessor");
const webServer = require("../../../server/http-server-manager");
const fs = require("fs/promises");
const { EffectCategory } = require("../../../shared/effect-constants");
const logger = require("../../logwrapper");
const path = require("path");

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
        icon: "fad fa-image",
        categories: [EffectCategory.COMMON, EffectCategory.FUN, EffectCategory.OVERLAY],
        dependencies: []
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
        <div style="padding-bottom: 10px;width: 100%;" ng-hide="effect.imageType === 'folderRandom'">
            <img ng-show="showImage" ng-src="{{getImagePreviewSrc()}}" imageonload="imageLoaded" style="height: 100px;width: 175px;object-fit: scale-down;background: #d7d7d7">
            <img ng-hide="showImage" src="{{placeHolderUrl}}" style="height: 100px;width: 175px;object-fit: scale-down;background: #d7d7d7">
        </div>
        <div class="controls-fb-inline" style="padding-bottom: 5px;">
            <label class="control-fb control--radio">Local file
                <input type="radio" ng-model="effect.imageType" value="local" ng-change="imageTypeUpdated()"/>
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">URL
                <input type="radio" ng-model="effect.imageType" value="url" ng-change="imageTypeUpdated()"/>
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">Random from folder
                <input type="radio" ng-model="effect.imageType" value="folderRandom" ng-change="imageTypeUpdated()"/>
                <div class="control__indicator"></div>
            </label>
        </div>
        <div ng-if="effect.imageType === 'folderRandom'" style="display: flex;flex-direction: row;align-items: center;">
            <file-chooser model="effect.folder" options="{ directoryOnly: true, filters: [], title: 'Select Image Folder'}"></file-chooser>
        </div>
        <div ng-if="effect.imageType === 'local'" style="display: flex;flex-direction: row;align-items: center;">
            <file-chooser model="effect.file" options="{ filters: [{ name: 'Image', extensions: [ 'bmp', 'gif', 'jpg', 'jpeg', 'png', 'apng', 'svg', 'webp' ]}, { name: 'All Files', extensions: ['*']} ]}"></file-chooser>
        </div>
        <div ng-if="effect.imageType === 'url'">
            <input type="text" class="form-control" ng-model="effect.url" placeholder="Enter url" replace-variables>
        </div>
    </div>
    </div>

    <eos-overlay-dimensions effect="effect" pad-top="true"></eos-overlay-dimensions>

    <eos-overlay-position effect="effect" class="setting-padtop"></eos-overlay-position>

    <div class="effect-setting-container setting-padtop">
    <div class="effect-specific-title"><h4>Duration</h4></div>
    <div class="effect-setting-content">
        <div class="input-group">
            <span class="input-group-addon">Seconds</span>
            <input
                type="text"
                class="form-control"
                aria-describedby="image-length-effect-type"
                replace-variables="number"
                ng-model="effect.length">
        </div>
    </div>
    </div>

    <eos-overlay-rotation effect="effect" pad-top="true"></eos-overlay-rotation>

    <eos-enter-exit-animations effect="effect" class="setting-padtop"></eos-enter-exit-animations>

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

        $scope.showOverlayInfoModal = function (overlayInstance) {
            utilityService.showOverlayInfoModal(overlayInstance);
        };

        $scope.placeHolderUrl = "../images/placeholders/image.png";

        $scope.showImage = false;
        $scope.imageLoaded = function (successful) {
            $scope.showImage = successful;
        };

        $scope.getImagePreviewSrc = function () {
            let path;
            if ($scope.effect.imageType === "local") {
                path = $scope.effect.file;
            } else if ($scope.effect.imageType === "url") {
                path = $scope.effect.url;
            } else {
                path = $scope.effect.folder;
            }

            return path;
        };

        $scope.imageTypeUpdated = function () {
            if ($scope.effect.imageType === "local") {
                $scope.effect.url = undefined;
                $scope.effect.folder = undefined;
            } else if ($scope.effect.imageType === "url") {
                $scope.effect.file = undefined;
                $scope.effect.folder = undefined;
            } else {
                $scope.effect.url = undefined;
                $scope.effect.file = undefined;
            }
        };
    },
    /**
     * When the effect is triggered by something
     * Used to validate fields in the option template.
     */
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.imageType == null) {
            errors.push("Please select an image type.");
        }
        if (effect.file == null && effect.url == null && effect.folder == null) {
            errors.push("Please select an image source, either file path, url, or folder.");
        }
        return errors;
    },
    /**
     * When the effect is triggered by something
     */
    onTriggerEvent: async (event) => {
        // What should this do when triggered.
        const effect = event.effect;

        let position = effect.position;
        if (position === "Random") {
            position = mediaProcessor.randomLocation();
        }

        const data = {
            filepath: effect.file,
            url: effect.url,
            folder: effect.folder,
            imageType: effect.imageType,
            imagePosition: position,
            imageHeight: effect.height ? `${effect.height}px` : "auto",
            imageWidth: effect.width ? `${effect.width}px` : "auto",
            imageDuration: effect.length,
            inbetweenAnimation: effect.inbetweenAnimation,
            inbetweenDelay: effect.inbetweenDelay,
            inbetweenDuration: effect.inbetweenDuration,
            inbetweenRepeat: effect.inbetweenRepeat,
            enterAnimation: effect.enterAnimation,
            enterDuration: effect.enterDuration,
            exitAnimation: effect.exitAnimation,
            exitDuration: effect.exitDuration,
            customCoords: effect.customCoords,
            imageRotation: effect.rotation ? effect.rotation + effect.rotType : "0deg"
        };

        if (SettingsManager.getSetting("UseOverlayInstances")) {
            if (effect.overlayInstance != null) {
                if (SettingsManager.getSetting("OverlayInstances").includes(effect.overlayInstance)) {
                    data.overlayInstance = effect.overlayInstance;
                }
            }
        }

        if (effect.imageType == null) {
            effect.imageType = "local";
        }

        if (effect.imageType === "local") {
            const resourceToken = ResourceTokenManager.storeResourcePath(effect.file, effect.length);
            data.resourceToken = resourceToken;
        }

        if (effect.imageType === "folderRandom") {
            let files = [];
            try {
                files = await fs.readdir(effect.folder);
            } catch (err) {
                logger.warn("Unable to read image folder", err);
            }

            const filteredFiles = files.filter(i => /\.(bmp|gif|jpg|jpeg|png|apng|svg|webp)$/i.test(i));

            const chosenFile = filteredFiles[Math.floor(Math.random() * filteredFiles.length)];

            const fullFilePath = path.join(effect.folder, chosenFile);

            const resourceToken = ResourceTokenManager.storeResourcePath(fullFilePath, effect.length);

            data.resourceToken = resourceToken;
        }

        webServer.sendToOverlay("image", data);
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
            name: "image",
            onOverlayEvent: (event) => {
                // Image Handling
                // This will take the data that is sent to it from the GUI and render an image on the overlay.
                const data = event;

                let filepathNew;
                if (data.imageType === "url") {
                    filepathNew = data.url;
                } else {
                    const token = encodeURIComponent(data.resourceToken);
                    filepathNew = `http://${window.location.hostname}:7472/resource/${token}`;
                }

                // NEW WAY EXAMPLE:
                const positionData = {
                    position: data.imagePosition,
                    customCoords: data.customCoords
                };

                const animationData = {
                    enterAnimation: data.enterAnimation,
                    enterDuration: data.enterDuration,
                    inbetweenAnimation: data.inbetweenAnimation,
                    inbetweenDelay: data.inbetweenDelay,
                    inbetweenDuration: data.inbetweenDuration,
                    inbetweenRepeat: data.inbetweenRepeat,
                    exitAnimation: data.exitAnimation,
                    exitDuration: data.exitDuration,
                    totalDuration: parseFloat(data.imageDuration) * 1000,
                    resourceToken: data.resourceToken
                };

                const styles =
                    (data.imageWidth ? `width: ${data.imageWidth};` : "") +
                    (data.imageHeight ? `height: ${data.imageHeight};` : "") +
                    (data.imageRotation ? `transform: rotate(${data.imageRotation});` : "");
                console.log(data.imageRotation);
                console.log(styles);
                const imageTag = `<img src="${filepathNew}" style="${styles}" />`;

                showElement(imageTag, positionData, animationData); // eslint-disable-line no-undef
            }
        }
    }
};

module.exports = showImage;
