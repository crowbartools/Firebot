"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const webServer = require("../../../server/httpServer");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

/**
 * The Show Events effect
 */
const showEvents = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:showevents",
        name: "Show Events",
        description: "Show events in the overlay.",
        tags: ["Built in"],
        hidden: true, // Deprecated
        dependencies: [EffectDependency.OVERLAY],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
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
    <event-list-text-options model="effect"></event-list-text-options>

    <div class="effect-info alert alert-warning">
        This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal()" style="text-decoration:underline">Learn more</a>
    </div>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, utilityService) => {
        $scope.showOverlayEventsModal = function() {
            utilityService.showOverlayEventsModal();
        };

        $scope.showOverlayInfoModal = function(overlayInstance) {
            utilityService.showOverlayInfoModal(overlayInstance);
        };
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        // What should this do when triggered.
        let effect = event.effect;
        let trigger = event.trigger;

        // Take global settings and effect settings and combine them into one packet.
        let combinedEffect = {},
            globalEffect = settings.getEventSettings();

        Object.keys(globalEffect).forEach(
            key => (combinedEffect[key] = globalEffect[key])
        );
        Object.keys(effect).forEach(key => (combinedEffect[key] = effect[key]));

        effect = combinedEffect;

        // Let's start processing.
        let control = trigger.metadata.control,
            username = trigger.metadata.username,
            controlText = control.text,
            controlCost = control.cost,
            controlCooldown = control.cooldown,
            text = effect.text,
            position = effect.position,
            data = {};


        // Replace 'user' varibles
        if (text !== null && text !== undefined) {
            text = text.replace("$(user)", username);
            text = text.replace("$(text)", controlText);
            text = text.replace("$(cost)", controlCost);
            text = text.replace("$(cooldown)", controlCooldown);
        }

        // Send data back to media.js in the gui.
        data = {
            showEventsText: text,
            showEventsType: effect.textType,
            showEventsColor: effect.color,
            showEventsBackgroundColor: effect.backgroundColor,
            showEventsFontSize: effect.size,
            showEventsPosition: position,
            showEventsAlignment: effect.textAlignment,
            showEventsHeight: effect.height,
            showEventsWidth: effect.width,
            showEventsDuration: effect.length,
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

        let resourceToken = resourceTokenManager.storeResourcePath(
            effect.file,
            effect.length
        );
        data.resourceToken = resourceToken;

        webServer.sendToOverlay("showevents", data);
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
            name: "showevents",
            onOverlayEvent: event => {
                console.log("yay show events");
                // Show Text Replace
                // This will animate out any showing effects before showing the next one.
                // Note that if there is a lot of spam this will drop many inputs.
                function showEventsElementReplace(
                    enterAnimation,
                    exitAnimation,
                    duration,
                    textFinal
                ) {
                    enterAnimation = enterAnimation ? enterAnimation : "fadeIn";
                    exitAnimation = exitAnimation ? exitAnimation : "fadeOut";

                    // Animate old showEvents message off of the page.
                    if ($(".showEventsMessage").length > 0) {
                        $(".showEventsMessage").animateCss(exitAnimation, () => {
                            // Remove old message.
                            $(".showEventsMessage").remove();
                            $(".showEventsHolder").append(textFinal);

                            // Add in new message and remove it after max duration
                            $(".showEventsMessage").animateCss(enterAnimation, () => {
                                setTimeout(function() {
                                    $(".showEventsMessage").animateCss(exitAnimation, () => {
                                        $(".showEventsMessage").remove();
                                    });
                                }, duration === 0 || duration != null ? duration : 5000);
                            });
                        });
                    } else {
                        $(".showEventsHolder").append(textFinal);

                        // Add in new message and remove it after max duration
                        $(".showEventsMessage").animateCss(enterAnimation, () => {
                            setTimeout(function() {
                                $(".showEventsMessage").animateCss(exitAnimation, () => {
                                    $(".showEventsMessage").remove();
                                });
                            }, duration === 0 || duration != null ? duration : 5000);
                        });
                    }
                }

                // Show Text Animation
                // This will add the text element to the bottom of the list.
                // This should be able to keep up with spam fine and works similar to most chat overlays.
                function showEventsElementList(
                    enterAnimation,
                    exitAnimation,
                    duration,
                    textFinal,
                    divClass
                ) {
                    enterAnimation = enterAnimation ? enterAnimation : "fadeIn";
                    exitAnimation = exitAnimation ? exitAnimation : "fadeOut";

                    // Animate old showEvents message off of the page.
                    $(".showEventsHolder").append(textFinal);

                    // Add in new message and remove it after max duration
                    $("." + divClass).animateCss(enterAnimation, () => {
                        setTimeout(function() {
                            $("." + divClass).animateCss(exitAnimation, () => {
                                $("." + divClass).remove();
                            });
                        }, duration === 0 || duration != null ? duration : 5000);
                    });
                }

                // Show Text Handling
                // This will take the data that is sent to it from the GUI and push some text to the overlay.
                function showEvents(data) {
                    let showEventsText = data.showEventsText;
                    let showEventsColor = data.showEventsColor;
                    let showEventsBackgroundColor = data.showEventsBackgroundColor;
                    let showEventsFontSize = data.showEventsFontSize;
                    let showEventsPosition = data.showEventsPosition;
                    let showEventsHeight = data.showEventsHeight;
                    let showEventsWidth = data.showEventsWidth;
                    let showEventsDuration = parseFloat(data.showEventsDuration) * 1000;
                    let showEventsType = data.showEventsType;
                    let showEventsAlignment = data.showEventsAlignment;

                    let customPosStyles = "";
                    if (showEventsPosition === "Custom") {
                        customPosStyles = getStylesForCustomCoords(data.customCoords); //eslint-disable-line no-undef
                    }

                    // Get time in milliseconds to use as class name.
                    let d = new Date();
                    let divClass = d.getTime();

                    let showEventsFinal;

                    // Add in our showEvents wrapper if it's not added already.
                    // This container can have a set width and height and holds all of the showEvents messages.
                    if (
                        $(".showEventsOverlay").width() !== showEventsWidth ||
            $(".showEventsOverlay").height() !== showEventsHeight ||
            $(".showEventsOverlay").attr("position") !== showEventsPosition
                    ) {
                        $(".showEventsOverlay").remove();

                        if (showEventsHeight === false && showEventsWidth === false) {
                            // Both height and width fields left blank.
                            showEventsFinal =
                '<div class="showEventsOverlay" position="' +
                showEventsPosition +
                '" style="display:block;' +
                customPosStyles +
                '"><div class="showEventsHolder"></div></div>';
                        } else if (showEventsWidth === false) {
                            // Width field left blank, but height provided.
                            showEventsFinal =
                '<div class="showEventsOverlay" position="' +
                showEventsPosition +
                '" style="display:block;height:' +
                showEventsHeight +
                "px;" +
                customPosStyles +
                '"><div class="showEventsHolder"></div></div>';
                        } else if (showEventsHeight === false) {
                            // Height field left blank, but width provided.
                            showEventsFinal =
                '<div class="showEventsOverlay" position="' +
                showEventsPosition +
                '" style="display:block;width:' +
                showEventsWidth +
                "px;height:100%;" +
                customPosStyles +
                '"><div class="showEventsHolder"></div></div>';
                        } else {
                            // Both height and width provided.
                            showEventsFinal =
                '<div class="showEventsOverlay" position="' +
                showEventsPosition +
                '" style="display:block;height:' +
                showEventsHeight +
                "px;width:" +
                showEventsWidth +
                "px;" +
                customPosStyles +
                '"><div class="showEventsHolder"></div></div>';
                        }
                        $("#wrapper").append(showEventsFinal);
                    }

                    // Put the showEvents text into the showEvents container.
                    let textFinal =
            '<div class="' +
            divClass +
            '-showEvents showEventsMessage" style="color: ' +
            showEventsColor +
            "; background-color: " +
            showEventsBackgroundColor +
            "; font-size: " +
            showEventsFontSize +
            "; text-align: " +
            showEventsAlignment +
            '">' +
            showEventsText +
            "</div>";

                    // Animate it!
                    if (showEventsType === "replace") {
                        showEventsElementReplace(
                            data.enterAnimation,
                            data.exitAnimation,
                            showEventsDuration,
                            textFinal
                        );
                    } else {
                        showEventsElementList(
                            data.enterAnimation,
                            data.exitAnimation,
                            showEventsDuration,
                            textFinal,
                            divClass + "-showEvents"
                        );
                    }
                }
            }
        }
    }
};

module.exports = showEvents;
