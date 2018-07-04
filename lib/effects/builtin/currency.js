"use strict";

const {
  EffectDefinition,
  EffectDependency,
  EffectTrigger
} = require("../models/effectModels");

/**
 * The Currency effect
 */
const currency = {
  /**
   * The definition of the Effect
   */
  definition: {
    id: "firebot:currency",
    name: "Currency",
    description: "Manage your currency systems.",
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
    <div class="effect-specific-title"><h4>Which currency should we use?</h4></div>
    <div class="btn-group">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span class="currency-name">{{effect.currency ? effect.currency.name : 'Pick one'}}</span> <span class="caret"></span>
        </button>
        <ul class="dropdown-menu currency-name-dropdown">
            <li ng-repeat="currency in currencies"
                ng-click="effect.currency = currency">
                <a href>{{currency.name}}</a>
            </li>
        </ul>
    </div>
    <div ng-if="effect.currency">
        <div class="effect-setting-container">
            <div class="effect-specific-title"><h4>Should we add or remove {{effect.currency.name}}?</h4></div>
            <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="currency-action">{{effect.action ? effect.action : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu currency-action-dropdown">
                    <li ng-click="effect.action = 'Add'">
                        <a href>Add</a>
                    </li>
                    <li ng-click="effect.action = 'Remove'">
                        <a href>Remove</a>
                    </li>
                </ul>
            </div>
        </div>
        <div class="effect-setting-container">
            <div class="effect-specific-title"><h4>Who should we give {{effect.currency.name}} to?</h4></div>
            <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="currency-target">{{effect.target ? effect.target : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu currency-action-dropdown">
                    <li ng-click="effect.target = 'Single User'">
                        <a href>Single User</a>
                    </li>
                    <li ng-click="effect.target = 'Viewer Role'">
                        <a href>Viewer Role</a>
                    </li>
                </ul>
            </div>
            <div ng-if="effect.target === 'Single User'">
                <div class="effect-specific-title"><h4>What is the person's name?</h4></div>
                <div class="effect-setting-container">
                    <div class="input-group">
                        <span class="input-group-addon" id="currency-user-type">User</span>
                        <input type="text" ng-model="effect.userTarget" class="form-control" id="currency-user-setting" aria-describedby="currency-user-type" placeholder="$(user)">
                    </div>
                </div>
                <div class="effect-setting-container">
                    <eos-replace-variables></eos-replace-variables>
                </div>
            </div>
            <div class="effect-setting-container" ng-if="effect.target">
                <div class="effect-specific-title"><h4>How many {{effect.currency.name}} do we want to {{effect.action.toLowerCase()}}?</h4></div>
                <div class="input-group">
                    <span class="input-group-addon" id="currency-units-type">Amount</span>
                    <input type="text" ng-model="effect.amount" class="form-control" id="currency-units-setting" aria-describedby="currency-units-type" type="number">
                </div>
            </div>
        </div>
    </div>
    `,
  /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
  optionsController: ($scope, currencyService) => {
    $scope.currencies = currencyService.getCurrencies();
  },
  /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
  optionsValidator: effect => {
    let errors = [];
    if (effect.currency == null) {
      errors.push("Please select a currency to use.");
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

      console.log(effect);
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
      name: "currency",
      onOverlayEvent: event => {
        console.log("yay currency");
      } //End event trigger
    }
  }
};

module.exports = currency;
