"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const webServer = require("../../../server/httpServer");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

/**
 * The HTML effect
 */
const html = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:html",
        name: "Show HTML",
        description: "Show an HTML snippet in the overlay.",
        icon: "fab fa-html5",
        categories: [EffectCategory.ADVANCED, EffectCategory.OVERLAY],
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
    <eos-container header="HTML">
        <textarea ng-model="effect.html" class="form-control" id="html-effect-html-field" name="text" placeholder="Input your HTML" rows="5" cols="40" replace-variables></textarea>
    </eos-container>

    <eos-container header="Show Duration" pad-top="true">
        <div class="input-group">
            <span class="input-group-addon" id="html-length-effect-type">Seconds</span>
            <input ng-model="effect.length" type="text" class="form-control" id="html-length-setting" aria-describedby="html-length-effect-type" type="number">
        </div>
        <eos-collapsable-panel show-label="Advanced" hide-label="Hide Advanced">
            <h4>Custom Removal CSS Selector</h4>
            <p style="margin-bottom:10px">Optionally define which element(s) to be removed after the given duration via a CSS class as a selector. Leave blank to have Firebot always remove all the html above (Recommended).</p>
            <div class="input-group">
                <span class="input-group-addon" id="html-selector-effect-type">CSS Class</span>
                <input ng-model="effect.removal" type="text" class="form-control" aria-describedby="html-selector-effect-type">
            </div>
        </eos-collapsable-panel>
    </eos-container>

    <eos-enter-exit-animations effect="effect" pad-top="true"></eos-enter-exit-animations>

    <eos-overlay-instance effect="effect" pad-top="true"></eos-overlay-instance>

    <eos-container>
        <div class="effect-info alert alert-warning">
            This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal()" style="text-decoration:underline">Learn more</a>
            <br /><br />
            Please be aware that this effect is <i>extremely</i> prone to errors due to it's open-ended nature.
        </div>
    </eos-container>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, utilityService) => {
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
        if (effect.html == null) {
            errors.push("Please enter some HTML to show in the overlay.");
        }
        if (effect.length == null) {
            errors.push("Please select a length to show the html in the overlay.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        // What should this do when triggered.
        let effect = event.effect;

        // They have an image loaded up for this one.
        let HTML = effect.html;
        let duration = effect.length;
        let removal = effect.removal;

        // Send data back to media.js in the gui.
        let data = {
            html: HTML,
            length: duration,
            removal: removal,
            inbetweenAnimation: effect.inbetweenAnimation,
            inbetweenDelay: effect.inbetweenDelay,
            inbetweenDuration: effect.inbetweenDuration,
            inbetweenRepeat: effect.inbetweenRepeat,
            enterAnimation: effect.enterAnimation,
            enterDuration: effect.enterDuration,
            exitAnimation: effect.exitAnimation,
            exitDuration: effect.exitDuration
        };

        if (settings.useOverlayInstances()) {
            if (effect.overlayInstance != null) {
                if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
                    data.overlayInstance = effect.overlayInstance;
                }
            }
        }

        webServer.sendToOverlay("html", data);
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
            name: "html",
            onOverlayEvent: event => {

                let element = $(event.html);

                element.hide();

                $('#wrapper').append(element);

                element.show();

                element.animateCss(event.enterAnimation, event.enterDuration, null, null, (data) => {

                    if (data.inbetweenAnimation != null && data.inbetweenAnimation !== "" && data.inbetweenAnimation !== "none") {
                        data.htmlElement.animateCss(data.inbetweenAnimation, data.inbetweenDuration, data.inbetweenDelay, data.inbetweenRepeat);
                    }

                    setTimeout(function() {
                        if (data.inbetweenAnimation != null && data.inbetweenAnimation !== "" && data.inbetweenAnimation !== "none") {
                            data.htmlElement.css("animation-duration", "");
                            data.htmlElement.css("animation-delay", "");
                            data.htmlElement.css("animation-iteration-count", "");
                            data.htmlElement.removeClass('animated ' + data.inbetweenAnimation);
                        }

                        // If CSS class is provided, remove element(s) with provided CSS class.
                        if (data.removal && data.removal.length > 0) {
                            let elementToRemove = $("#wrapper").find("." + data.removal);

                            //If no elements found, remove original element.
                            if (elementToRemove.length < 1) {
                                elementToRemove = data.htmlElement;
                            }

                            elementToRemove.animateCss(data.exitAnimation || "fadeOut", data.exitDuration, null, null, function() {
                                elementToRemove.remove();
                            });
                        } else {
                            data.htmlElement.animateCss(data.exitAnimation || "fadeOut", data.exitDuration, null, null, function() {
                                data.htmlElement.remove();
                            });
                        }
                    }, parseFloat(data.duration || 5) * 1000);
                }, {
                    htmlElement: element,
                    removal: event.removal,
                    duration: event.length,
                    exitAnimation: event.exitAnimation,
                    exitDuration: event.exitDuration,
                    inbetweenAnimation: event.inbetweenAnimation,
                    inbetweenDuration: event.inbetweenDuration,
                    inbetweenDelay: event.inbetweenDelay,
                    inbetweenRepeat: event.inbetweenRepeat
                });
            }
        }
    }
};

module.exports = html;
