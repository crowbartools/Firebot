"use strict";

const { settings } = require("../../common/settings-access");

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
            <span class="currency-name">{{effect.currency ? effect.currency : 'Pick one'}}</span> <span class="caret"></span>
        </button>
        <ul class="dropdown-menu currency-name-dropdown">
            <li ng-repeat="currency in currencies"
                ng-click="effect.currency = currency">
                <a href>{{currency}}</a>
            </li>
        </ul>
    </div>
  <div class="effect-specific-title"><h4>Should we add or remove currency?</h4></div>
  <div class="btn-group">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span class="currency-action">{{effect.action ? effect.action : 'Pick one'}}</span> <span class="caret"></span>
        </button>
        <ul class="dropdown-menu currency-action-dropdown">
            <li ng-click="effect.action = Add">
                <a href>Add</a>
            </li>
            <li ng-click="effect.action = Remove">
                <a href>Remove</a>
            </li>
        </ul>
    </div>
    </div>
    <div class="effect-setting-container">
        <div class="effect-specific-title"><h4>How much currency do we want to change?</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="currency-units-type">Units</span>
            <input type="text" ng-model="effect.units" class="form-control" id="currency-units-setting" aria-describedby="currency-units-type" type="number">
        </div>
    </div>
    <div class="effect-setting-container">
        <div class="effect-specific-title"><h4>Do you want to let chat know?</h4></div>
        <eos-chatter-select effect="effect" title="Chat as"></eos-chatter-select>

        <eos-container header="Message To Send" pad-top="true">
            <textarea ng-model="effect.message" class="form-control" name="text" placeholder="Enter message" rows="4" cols="40"></textarea>
            <div style="color:red" ng-if="effect.message && effect.message.length > 360">Chat messages cannot be longer than 360 characters. This message will get automatically trimmed if the length is still too long after all replace variables have been populated.</div>
            <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 10px 0 10px; align-items: center;">
                <label class="control-fb control--checkbox" style="margin: 0px 15px 0px 0px"> Whisper</tooltip>
                    <input type="checkbox" ng-init="whisper = (effect.whisper != null && effect.whisper !== '')" ng-model="whisper" ng-click="effect.whisper = ''">
                    <div class="control__indicator"></div>
                </label>
                <div ng-show="whisper">
                    <div class="input-group">
                        <span class="input-group-addon" id="chat-whisper-effect-type">To</span>
                        <input ng-model="effect.whisper" type="text" class="form-control" id="chat-whisper-setting" aria-describedby="chat-text-effect-type" placeholder="Username">
                    </div>
                </div>
            </div>   
        </eos-container>
        
        <eos-replace-variables></eos-replace-variables>
    </div>

    `,
  /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
  optionsController: $scope => {
    //
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
