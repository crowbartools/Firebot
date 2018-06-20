"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const celebrationProcessor = require("../../common/handlers/celebrationProcessor");

const {
  EffectDefinition,
  EffectDependency,
  EffectTrigger
} = require("../models/effectModels");

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
    description: "Celebrate with a variety of overlay effects.",
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
  <div class="effect-specific-title"><h4>How should we celebrate?</h4></div>
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
    </div>
    <div class="effect-setting-container">
        <div class="effect-specific-title"><h4>How many seconds should the party last?</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="celebration-length-effect-type">Seconds</span>
            <input type="text" ng-model="effect.length" class="form-control" id="celebration-amount-setting" aria-describedby="celebration-length-effect-type" type="number">
        </div>
    </div>
    <div class="effect-info alert alert-warning">
        This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal()" style="text-decoration:underline">Learn more</a>
    </div>
    `,
  /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
  optionsController: $scope => {
    $scope.celebrationTypes = ["Fireworks"];
    if ($scope.effect.length == null) {
      $scope.effect.length = 5;
    }
  },
  /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
  optionsValidator: effect => {
    let errors = [];
    if (effect.celebration == null) {
      errors.push("Please select how you'd like to celebrate.");
    }
    return errors;
  },
  /**
   * When the effect is triggered by something
   */
  onTriggerEvent: event => {
    return new Promise((resolve, reject) => {
      // What should this do when triggered.
      celebrationProcessor.play(event.effect);
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
      name: "celebrate",
      onOverlayEvent: event => {
        console.log("yay celebration");
        //need to implement this
      }
    }
  }
};

module.exports = celebration;
