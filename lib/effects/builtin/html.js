"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const webServer = require("../../../server/httpServer");
const {
  EffectDefinition,
  EffectDependency,
  EffectTrigger
} = require("../models/effectModels");

/**
 * The HTML effect
 */
const html = {
  /**
   * The definition of the Effect
   */
  definition: {
    id: "firebot:html",
    name: "HTML Effect",
    description: "Show an HTML snippet in the overlay.",
    tags: ["Built in"],
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
    <div class="effect-specific-title"><h4>What HTML should we output?</h4></div>
    <textarea ng-model="effect.html" class="form-control" id="html-effect-html-field" name="text" placeholder="Input your HTML" rows="5" cols="40"></textarea>
    </div>
    <div class="effect-setting-container">
    <div class="effect-specific-title"><h4>How long should it show?</h4></div>
    <div class="input-group">
        <span class="input-group-addon" id="html-length-effect-type">Seconds</span>
        <input ng-model="effect.length" type="text" class="form-control" id="html-length-setting" aria-describedby="html-length-effect-type" type="number">
    </div>
    </div>
    <div class="effect-setting-container">
    <div class="effect-specific-title"><h4>What item should I remove after the show timer expires?</h4></div>
    <div class="input-group">
        <span class="input-group-addon" id="html-selector-effect-type">CSS Class</span>
        <input ng-model="effect.removal" type="text" class="form-control" id="html-selector-setting" aria-describedby="html-selector-effect-type">
    </div>
    </div>
    <eos-enter-exit-animations effect="effect" limit-to="Exit"></eos-enter-exit-animations>
    <eos-overlay-instance effect="effect"></eos-overlay-instance>
    <div class="effect-info alert alert-warning">
    This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal()" style="text-decoration:underline">Learn more</a>
    <br /><br />
    Also, please be aware that this button is EXTREMELY prone to error due to open ended nature.
    </div>
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
    if (effect.removal == null) {
      errors.push("Please enter the class of the HTML wrapper.");
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

      // They have an image loaded up for this one.
      let HTML = effect.html;
      let duration = effect.length;
      let removal = effect.removal;

      // Send data back to media.js in the gui.
      let data = {
        html: HTML,
        length: duration,
        removal: removal,
        enterAnimation: effect.enterAnimation,
        exitAnimation: effect.exitAnimation
      };

      if (settings.useOverlayInstances()) {
        if (effect.overlayInstance != null) {
          if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
            data.overlayInstance = effect.overlayInstance;
          }
        }
      }

      webServer.sendToOverlay("html", data);
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
      name: "html",
      onOverlayEvent: event => {
        console.log("yay html effect");

        let HTML = event.html;
        let length = parseFloat(event.length) * 1000;
        let mainClass = event.removal;

        let exitAnimation = event.exitAnimation
          ? event.exitAnimation
          : "fadeOut";

        // Throw HTML on page.
        $("#wrapper").append(HTML);

        // In X time remove it.
        setTimeout(function() {
          $("." + mainClass).animateCss(exitAnimation, function() {
            $("." + mainClass).remove();
          });
        }, length);
      }
    }
  }
};

module.exports = html;
