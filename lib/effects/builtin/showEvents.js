"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const showEventsProcessor = require("../../common/handlers/showEventsProcessor");

const {
  EffectDefinition,
  EffectDependency,
  EffectTrigger
} = require("../models/effectModels");

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
  onTriggerEvent: event => {
    return new Promise((resolve, reject) => {
      // What should this do when triggered.
      showEventsProcessor.go(event.effect, event.trigger);
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
      name: "showevents",
      onOverlayEvent: event => {
        console.log("yay show events");
        //need to implement this
      }
    }
  }
};

module.exports = showEvents;
