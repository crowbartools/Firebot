"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');

const clip = {
    definition: {
        id: "firebot:screenshot",
        name: "Take Screenshot",
        description: "Takes a screenshot of the selected screen.",
        icon: "fad fa-camera",
        categories: [EffectCategory.FUN],
        dependencies: [],
        outputs: [
            {
                label: "Screenshot Data URL",
                description: "The base64 data URL for the screenshot.",
                defaultName: "screenshotDataUrl"
            }
        ]
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Display">
            <dropdown-select options="displayOptions" selected="effect.displayId"></dropdown-select>
        </eos-container>

        <screenshot-effect-options effect="effect"></screenshot-effect-options>

        <eos-container pad-top="true">
            <div class="effect-info alert alert-info">
                Note: Screenshots will capture the entirety of the selected display.
            </div>
        </eos-container>
    `,
    optionsController: ($scope, backendCommunicator) => {
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
        const screenshotHelpers = require("../../common/screenshot-helpers");

        const { effect } = event;

        const screenshotDataUrl = await screenHelpers.takeScreenshot(effect.displayId);

        if (screenshotDataUrl != null) {

            const base64ImageData = screenshotDataUrl.split(';base64,').pop();
            if (effect.saveLocally) {
                await screenshotHelpers.saveScreenshotToFolder(base64ImageData, effect.folderPath, effect.fileNamePattern);
            }

            if (effect.overwriteExisting) {
                await screenshotHelpers.saveScreenshotToFile(base64ImageData, effect.file);
            }

            if (effect.postInDiscord) {
                await screenshotHelpers.sendScreenshotToDiscord(base64ImageData, effect.discordChannelId);
            }

            if (effect.showInOverlay) {
                screenshotHelpers.sendScreenshotToOverlay(screenshotDataUrl, effect);
            }
        }

        return {
            success: screenshotDataUrl != null,
            outputs: {
                screenshotDataUrl: screenshotDataUrl != null ? screenshotDataUrl : ""
            }
        };
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
