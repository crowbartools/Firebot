"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const controlProcessor = require("../../common/handlers/controlEmulation/controlProcessor");

const {
  EffectDefinition,
  EffectDependency,
  EffectTrigger
} = require("../models/effectModels");

/**
 * The Control Emulation effect
 */
const controlEmulation = {
  /**
   * The definition of the Effect
   */
  definition: {
    id: "firebot:controlemulation",
    name: "Control Emulation",
    description: "Emulation various types of controls.",
    tags: ["Fun", "Built in"],
    dependencies: [],
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
        <div class="effect-specific-title"><h4>Which button should I press?</h4></div>
        <div class="input-group game-press">
        <span class="input-group-addon" id="button-press-effect-type">Press</span>
        <input type="text" ng-model="effect.press" uib-typeahead="control for control in validControls | filter:$viewValue | limitTo:8" class="form-control" id="game-control-press-setting" aria-describedby="button-press-effect-type">
        </div>
        </div>
        <div class="effect-setting-container">
        <div class="effect-specific-title"><h4>Should we also press any modifiers?</h4></div>
        <div class="button-press-modifier-effect-type" style="padding-left: 15px;">
        <label ng-repeat="modifier in validModifiers" class="control-fb control--checkbox">{{modifier}}
        <input type="checkbox" ng-click="modifierArray(effect.modifiers,modifier)" ng-checked="modifierCheckboxer(effect.modifiers,modifier)"  aria-label="..." >
        <div class="control__indicator"></div>
        </label>
        </div>
        </div>
        <div class="effect-setting-container">
        <div class="effect-specific-title"><h4>Does this button have an opposite button? (EX: Game Movement)</h4></div>
        <div class="input-group game-opposite">
        <span class="input-group-addon" id="opposite-button-effect-type">Opposite</span>
        <input type="text" ng-model="effect.opposite" uib-typeahead="control for control in validControls | filter:$viewValue | limitTo:8" class="form-control" id="game-control-opposite-setting" aria-describedby="opposite-button-effect-type">
        </div>
        </div>
        <div class="effect-setting-container">
        <div class="effect-specific-title"><h4>Is this a button that should be held down?</h4></div>
        <div class="btn-group">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span class="holding-button-effect-type">{{effect.holding ? effect.holding : 'No'}}</span> <span class="caret"></span>
        </button>
        <ul class="dropdown-menu holding-button-effect-dropdown">
            <li ng-click="effect.holding = 'No'"><a href>No</a></li>
            <li ng-click="effect.holding = 'Yes'"><a href>Yes</a></li>
        </ul>
        </div>
        </div>
        <div class="effect-info alert alert-info">
        Game controls do not work in every game or with every program. These are emulated controls. If the controls aren't working on your game or app try changing the emulator in the app settings.
        </div>
    `,
  /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
  optionsController: ($scope, listenerService, effectHelperService) => {
    $scope.validControls = [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "backspace",
      "delete",
      "enter",
      "space",
      "tab",
      "escape",
      "up",
      "down",
      "left",
      "right",
      "home",
      "end",
      "pageup",
      "pagedown",
      "f1",
      "f2",
      "f3",
      "f4",
      "f5",
      "f6",
      "f7",
      "f8",
      "f9",
      "f10",
      "f11",
      "f12",
      "alt",
      "control",
      "shift",
      "numpad_0",
      "numpad_1",
      "numpad_2",
      "numpad_3",
      "numpad_4",
      "numpad_5",
      "numpad_6",
      "numpad_7",
      "numpad_8",
      "numpad_9",
      "leftmouse",
      "middlemouse",
      "rightmouse",
      "audio_mute",
      "audio_vol_down",
      "audio_vol_up",
      "audio_play",
      "audio_stop",
      "audio_pause",
      "audio_prev",
      "audio_next"
    ];

    $scope.validModifiers = ["Control", "Alt", "Shift"];

    // This sets the effect.modifier to an array of checked items.
    $scope.modifierArray = function(list, item) {
      $scope.effect.modifiers = effectHelperService.getCheckedBoxes(list, item);
    };

    // This checks if an item is in the effect.modifier array and returns true.
    // This allows us to check boxes when loading up this button effect.
    $scope.modifierCheckboxer = function(list, item) {
      return effectHelperService.checkSavedArray(list, item);
    };
  },
  /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
  optionsValidator: effect => {
    let errors = [];
    if (effect.press == null) {
      errors.push("Please select a control to press.");
    }
    return errors;
  },
  /**
   * When the effect is triggered by something
   */
  onTriggerEvent: event => {
    return new Promise((resolve, reject) => {
      // What should this do when triggered.
      console.log("control emulation triggered.");
      console.log("The event data:");
      console.log(event);
      console.log(event.effect);
      controlProcessor.press(event.trigger.metadata.inputEvent, event.effect);
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
      name: "controlprocessor",
      onOverlayEvent: event => {
        console.log("yay control processor");
        //need to implement this
      }
    }
  }
};

module.exports = controlEmulation;
