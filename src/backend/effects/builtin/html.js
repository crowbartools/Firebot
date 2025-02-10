"use strict";

const { SettingsManager } = require("../../common/settings-manager");
const webServer = require("../../../server/http-server-manager");
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
    <eos-container header="HTML">
        <div
            ui-codemirror="{onLoad : codemirrorLoaded}"
            ui-codemirror-opts="editorSettings"
            ng-model="effect.html"
            replace-variables
            menu-position="under">
        </div>
    </eos-container>

    <eos-container header="Show Duration" pad-top="true">
        <div class="input-group">
            <span class="input-group-addon" id="html-length-effect-type">Seconds</span>
            <input ng-model="effect.length" type="text" class="form-control" id="html-length-setting" aria-describedby="html-length-effect-type" replace-variables="number">
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
            Please be aware that this effect is <i>extremely</i> prone to errors due to its open-ended nature.
            <br /><br />
            When using variables that are derived from user provided content, it is recommended to escape the value using <code>$encodeForHtml[$variable]</code>.
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

        $scope.editorSettings = {
            mode: 'htmlmixed',
            theme: 'blackboard',
            lineNumbers: true,
            autoRefresh: true,
            showGutter: true
        };

        $scope.codemirrorLoaded = function(_editor) {
            // Editor part
            _editor.refresh();
            const cmResize = require("cm-resize");
            cmResize(_editor, {
                minHeight: 200,
                resizableWidth: false,
                resizableHeight: true
            });
        };
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.html == null) {
            errors.push("Please enter some HTML to show in the overlay.");
        }
        if (effect.length == null) {
            errors.push("Please input a show duration.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async (event) => {
        // What should this do when triggered.
        const effect = event.effect;

        // They have an image loaded up for this one.
        const HTML = effect.html;
        const duration = effect.length;
        const removal = effect.removal;

        // Send data back to media.js in the gui.
        const data = {
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

        if (SettingsManager.getSetting("UseOverlayInstances")) {
            if (effect.overlayInstance != null) {
                if (SettingsManager.getSetting("OverlayInstances").includes(effect.overlayInstance)) {
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
            onOverlayEvent: (event) => {
                // The absolute position prevents the html effect from always being underneath other effects.
                const element = $(event.html).css({"position": "absolute"});

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
                            data.htmlElement.removeClass(`animated ${data.inbetweenAnimation}`);
                        }

                        // If CSS class is provided, remove element(s) with provided CSS class.
                        if (data.removal && data.removal.length > 0) {
                            let elementToRemove = $("#wrapper").find(`.${data.removal}`);

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
