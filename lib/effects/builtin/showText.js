"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const mediaProcessor = require("../../common/handlers/mediaProcessor");

const {
  EffectDefinition,
  EffectDependency,
  EffectTrigger
} = require("../models/effectModels");

/**
 * The Show Text effect
 */
const showText = {
  /**
   * The definition of the Effect
   */
  definition: {
    id: "firebot:showtext",
    name: "Show Text",
    description: "Shows specified text in the overlay.",
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
  <eos-container header="Text">
    <summernote ng-model="effect.text" config="editorOptions"></summernote>
    
    <eos-replace-variables></eos-replace-variables>
    </eos-container>

    <eos-container header="Dimensions" class="setting-padtop">
    <p>This defines the size of the (invisible) box that the above text will be placed in.</p>
    <div class="input-group">
        <span class="input-group-addon">Width (in pixels)</span>
        <input 
            class="form-control" 
            type="number"
            min="1" max="10000"
            ng-model="effect.width">
        <span class="input-group-addon">Height (in pixels)</span>
        <input 
            class="form-control"
            type="number"
            min="1" max="10000"
            ng-model="effect.height">
    </div>
    </eos-container>

    <eos-overlay-position effect="effect" class="setting-padtop"></eos-overlay-position>

    <eos-enter-exit-animations effect="effect" class="setting-padtop"></eos-enter-exit-animations>

    <eos-container header="Duration" class="setting-padtop">
    <div class="input-group">
        <span class="input-group-addon">Seconds</span>
        <input
            class="form-control"
            type="number"
            ng-model="effect.duration">
    </div>
    </eos-container>

    <eos-overlay-instance effect="effect" class="setting-padtop"></eos-overlay-instance>

    <div class="effect-info alert alert-warning">
    This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal(effect.overlayInstance)" style="text-decoration:underline">Learn more</a>
    </div>
    `,
  /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
  optionsController: ($scope, listenerService) => {
    if ($scope.effect.height == null || $scope.effect.height < 1) {
      $scope.effect.height = 200;
    }

    if ($scope.effect.width == null || $scope.effect.width < 1) {
      $scope.effect.width = 400;
    }

    $scope.editorOptions = {
      height: 300,
      disableDragAndDrop: true,
      toolbar: [
        ["style", ["bold", "italic", "underline", "clear"]],
        ["fontname", ["fontname"]],
        ["fontsize", ["fontsize"]],
        ["color", ["color"]],
        ["para", ["ul", "ol"]],
        ["misc", ["undo", "redo", "codeview"]]
      ],
      fontSizes: [
        "8",
        "9",
        "10",
        "11",
        "12",
        "14",
        "18",
        "24",
        "36",
        "48",
        "64",
        "82",
        "150",
        "200",
        "250",
        "300"
      ]
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
    if (effect.text == null) {
      errors.push("Please enter some text to show.");
    }
    return errors;
  },
  /**
   * When the effect is triggered by something
   */
  onTriggerEvent: event => {
    return new Promise((resolve, reject) => {
      // What should this do when triggered.
      mediaProcessor.text(event.effect);
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
      name: "showtext",
      onOverlayEvent: event => {
        console.log("yay show text");
        //need to implement this
      }
    }
  }
};

module.exports = showText;
