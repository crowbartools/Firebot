"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const apiProcessor = require("../../common/handlers/apiProcessor");

const {
  EffectDefinition,
  EffectDependency,
  EffectTrigger
} = require("../models/effectModels");

/**
 * The API effect
 */
const api = {
  /**
   * The definition of the Effect
   */
  definition: {
    id: "firebot:api",
    name: "API Effect",
    description: "Pulls info from a pre-selected api.",
    tags: ["Fun", "API", "Built in"],
    dependencies: [EffectDependency.CHAT],
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
        <div class="effect-specific-title"><h4>Which API should I use?</h4></div>
        <div class="btn-group">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="api-effect-type">{{effect.api ? effect.api : 'Pick one'}}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu api-effect-dropdown">
                <li ng-repeat="api in apiTypes"
                    ng-click="effectClick(api)">
                    <a href>{{api.name}}</a>
                </li>
            </ul>
        </div>
    </div>
    <div class="effect-setting-container" ng-if="effect.api !== null && effect.api !== 'Pick one'">
        <div class="effect-specific-title"><h4>Where should we send this?</h4></div>
        <div class="controls-fb-inline" style="padding-bottom: 5px;">
            <label class="control-fb control--radio">Chat
                <input type="radio" ng-model="effect.show" value="chat"/> 
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio" ng-if="effect.imageAvailable">Overlay
                <input type="radio" ng-model="effect.show" value="overlay"/>
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio" ng-if="effect.imageAvailable">Both
                <input type="radio" ng-model="effect.show" value="both"/>
                <div class="control__indicator"></div>
            </label>
        </div>
    </div>

    <div class="effect-chat-settings" ng-if="effect.show === 'chat' || effect.show ==='both'">
        <eos-chatter-select effect="effect" title="Who should I send this to chat as?"></eos-chatter-select>
    </div>

    <div class="effect-chat-settings" ng-if="effect.show === 'overlay' && effect.imageAvailable || effect.show ==='both' && effect.imageAvailable">
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
    </div>

    <div class="effect-info alert alert-danger">
    Warning: These API's pull from a third party and we have no control over the quality or content.
    </div>
    `,
  /**
   * The controller for the front end Options
   */
  optionsController: ($scope, listenerService) => {
    // The name of the api and if it has images available to show or not.
    $scope.apiTypes = [
      { name: "Advice", image: false },
      { name: "Cat Picture", image: true },
      { name: "Cat Fact", image: false },
      { name: "Dad Joke", image: false },
      { name: "Dog Picture", image: true },
      { name: "Dog Fact", image: false },
      { name: "Aww", image: true },
      { name: "Pokemon", image: false },
      { name: "Number Trivia", image: false }
    ];

    // When an api is clicked in the dropdown save its name and if it has images available.
    $scope.effectClick = function(api) {
      $scope.effect.api = api.name;
      $scope.effect.imageAvailable = api.image;
    };
  },
  /**
   * When the effect is triggered by something
   */
  optionsValidator: effect => {
    let errors = [];
    if (effect.api == null) {
      errors.push("Please select an API from the list.");
    }

    if (effect.show == null) {
      errors.push("Please select a places to show the API results.");
    }
    return errors;
  },
  /**
   * When the effect is triggered by something
   */
  onTriggerEvent: event => {
    return new Promise((resolve, reject) => {
      apiProcessor.go(event.effect);
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
      name: "apiEffect",
      onOverlayEvent: event => {
        // The API Effect can sometimes show images in the overlay.
        // As part of this we use the showImage event.
      }
    }
  }
};

module.exports = api;
