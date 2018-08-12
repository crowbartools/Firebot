"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const cooldownsProcessor = require("../../common/handlers/cooldownProcessor");

const {
    EffectDefinition,
    EffectDependency,
    EffectTrigger
} = require("../models/effectModels");

/**
 * The Cooldown effect
 */
const cooldown = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:cooldown",
        name: "Cooldown Controls",
        description: "Put specific MixPlay controls on cooldown.",
        tags: ["Built in"],
        dependencies: [EffectDependency.INTERACTIVE],
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
  <div class="effect-specific-title"><h4>Which buttons should I put on cooldown?</h4></div>
  <div class="cooldown-group-buttons">
        <label ng-repeat="button in boardButtons" class="control-fb control--checkbox">{{button}}
            <input type="checkbox" ng-click="buttonArray(effect.buttons,button)" ng-checked="buttonCheckboxer(effect.buttons,button)">
            <div class="control__indicator"></div>
        </label>
    </div>
    <div class="cooldown-group-button-reset">
        <button ng-click="uncheckAll()" class="btn btn-warning">Uncheck all</button>
    </div>
    </div>
    <div class="effect-setting-container">
    <div class="effect-specific-title"><h4>How long should these cooldown for?</h4></div>
    <div class="input-group">
        <span class="input-group-addon" id="cooldown-amount-effect-type">Seconds</span>
        <input ng-model="effect.length" type="text" class="form-control" id="cooldown-amount-setting" aria-describedby="cooldown-amount-effect-type" type="number">
    </div>
    </div>
    <div class="effect-info alert alert-info">
        If you want to cool down a lot of buttons at the same time, give the cooldown groups a try in the board main settings!
    </div>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, effectHelperService) => {
    // Get all control id's in an array so we can add checkboxes.
        $scope.boardButtons = boardService
            .getControlsForSelectedBoard()
            .filter(c => c.kind === "button" || c.kind === "textbox")
            .map(b => b.controlId);

        // This sets the effect.buttons to an array of checked items.
        $scope.buttonArray = function(list, item) {
            $scope.effect.buttons = effectHelperService.getCheckedBoxes(list, item);
        };

        // This checks if an item is in the effect.buttons array and returns true.
        // This allows us to check boxes when loading up this button effect.
        $scope.buttonCheckboxer = function(list, item) {
            return effectHelperService.checkSavedArray(list, item);
        };

        // Uncheck all checkboxes.
        $scope.uncheckAll = function() {
            $scope.effect.buttons = [];
        };
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.length == null) {
            errors.push("Please input a cooldown time.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise((resolve, reject) => {
            // What should this do when triggered.
            cooldownsProcessor.go(event.effect);
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
            name: "cooldown",
            onOverlayEvent: event => {
                console.log("yay cooldown");
                //need to implement this
            }
        }
    }
};

module.exports = cooldown;
