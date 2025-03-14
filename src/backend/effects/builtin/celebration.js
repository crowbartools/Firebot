"use strict";

const webServer = require("../../../server/http-server-manager");
const { EffectCategory } = require('../../../shared/effect-constants');
const { SettingsManager } = require("../../common/settings-manager");

/**
 * The Celebration effect
 */
const celebration = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:celebration",
        name: "Celebration",
        description: "Celebrate with firework overlay effects.",
        icon: "fad fa-birthday-cake",
        categories: [EffectCategory.FUN, EffectCategory.OVERLAY],
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
    <eos-container header="Celebration Type">
        <div class="btn-group">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="celebrate-effect-type">{{effect.celebration ? effect.celebration : 'Pick one'}}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu celebrate-effect-dropdown">
                <li ng-repeat="celebration in celebrationTypes"
                    ng-click="effect.celebration = celebration">
                    <a href>{{celebration}}</a>
                </li>
            </ul>
        </div>
    </eos-container>

    <eos-container header="Duration" pad-top="true">
        <firebot-input input-title="Seconds" data-type="number" model="effect.length" placeholder-text="5" menu-position="under"/>
    </eos-container>

    <eos-overlay-instance effect="effect" pad-top="true"></eos-overlay-instance>

    <eos-container>
        <div class="effect-info alert alert-warning">
            This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal()" style="text-decoration:underline">Learn more</a>
        </div>
    </eos-container>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, utilityService) => {
        $scope.celebrationTypes = ["Fireworks", "Confetti"];
        if ($scope.effect.length == null) {
            $scope.effect.length = 5;
        }

        $scope.showOverlayInfoModal = function (overlayInstance) {
            utilityService.showOverlayInfoModal(overlayInstance);
        };
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.celebration == null) {
            errors.push("Please select how you'd like to celebrate.");
        }
        return errors;
    },
    getDefaultLabel: (effect) => {
        return `${effect.celebration} - ${effect.length} seconds`;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async (event) => {
        // What should this do when triggered.
        const effect = event.effect;

        // Get report info
        const celebrationType = effect.celebration;
        const celebrationDuration = effect.length;

        // Send data to renderer.
        const data = {
            event: "celebration",
            celebrationType: celebrationType,
            celebrationDuration: celebrationDuration
        };

        if (SettingsManager.getSetting("UseOverlayInstances")) {
            if (effect.overlayInstance != null) {
                if (SettingsManager.getSetting("OverlayInstances").includes(effect.overlayInstance)) {
                    data.overlayInstance = effect.overlayInstance;
                }
            }
        }

        // Send to overlay.
        webServer.sendToOverlay("celebrate", data);
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
            name: "celebrate",
            onOverlayEvent: (data) => {

                // Celebrate Packet
                //{"event": "celebration", "celebrationType": celebrationType, "celebrationDuration":celebrationDuration};
                const type = data.celebrationType;
                const duration = parseFloat(data.celebrationDuration) * 1000; //convert to milliseconds.

                // Generate UUID to use as class name.
                // eslint-disable-next-line no-undef
                const divClass = uuid();

                if (type === "Fireworks") {
                    const canvas = `<canvas id="fireworks" class="${divClass}-fireworks celebration ${type}" style="display:none; z-index: 99;"></canvas>`;

                    // Throw div on page and start up.
                    $('.wrapper').append(canvas);
                    $(`.${divClass}-fireworks`).fadeIn('fast');

                    const stage = fireworks(); // eslint-disable-line no-undef

                    setTimeout(function (stage) {

                        stage.removeAllChildren();
                        stage.removeAllEventListeners();
                        stage.canvas = null;
                        stage._eventListeners = null;

                        $(`.${divClass}-fireworks`).fadeOut('fast', function () {
                            $(`.${divClass}-fireworks`).remove();
                        });
                    }, duration, stage);
                }

                if (type === "Confetti") {
                    const canvas = `<canvas id="confetti" class="${divClass}-confetti celebration ${type}" style="display:none; z-index: 99;"></canvas>`;

                    // Throw div on page and start up.
                    $('.wrapper').append(canvas);
                    $(`.${divClass}-confetti`).fadeIn('fast');

                    const confettiStage = confetti.create(document.getElementsByClassName(`${divClass}-confetti`)[0], { // eslint-disable-line no-undef
                        resize: true,
                        useWorker: true
                    });

                    const confettiParty = setInterval(function () {
                        // launch a few confetti from the left edge
                        confettiStage({ // eslint-disable-line no-undef
                            particleCount: 10,
                            angle: 60,
                            spread: 40,
                            startVelocity: 90,
                            shapes: ['circle', 'circle', 'square'],
                            scalar: 1.65,
                            origin: { x: 0, y: 0.9 }
                        });
                        // and launch a few from the right edge
                        confettiStage({ // eslint-disable-line no-undef
                            particleCount: 10,
                            angle: 120,
                            spread: 40,
                            startVelocity: 90,
                            shapes: ['circle', 'circle', 'square'],
                            scalar: 1.65,
                            origin: { x: 1, y: 0.9 }
                        });
                    }, 250);

                    setTimeout(function (confettiStage) {
                        $(`.${divClass}-confetti`).fadeOut('slow', function () {
                            $(`.${divClass}-confetti`).remove();
                            confettiStage.reset();
                            clearInterval(confettiParty);
                        });
                    }, duration, confettiStage);
                }
            }
        }
    }
};

module.exports = celebration;
