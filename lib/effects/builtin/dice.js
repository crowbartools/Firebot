"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const diceProcessor = require("../../common/handlers/diceProcessor");

const {
    EffectDefinition,
    EffectDependency,
    EffectTrigger
} = require("../models/effectModels");

/**
 * The Dice effect
 */
const dice = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:dice",
        name: "Dice Effect",
        description: "Specify an amount of dice to roll in chat.",
        tags: ["Fun", "Built in"],
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
    <eos-chatter-select effect="effect" title="Who should I announce the roll as?"></eos-chatter-select>
    <div class="effect-setting-container">
        <div class="effect-specific-title"><h4>Who should I whisper this to? Leave blank to broadcast to everyone.</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="dice-whisper-effect-type">Whisper</span>
            <input type="text" ng-model="effect.whisper" class="form-control" id="dice-whisper-setting" aria-describedby="dice-text-effect-type">
        </div>
    </div>
    <div class="effect-setting-container">
        <div class="effect-specific-title"><h4>What should I roll?</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="dice-text-effect-type">Dice</span>
            <input type="text" ng-model="effect.dice" class="form-control" id="dice-text-setting" aria-describedby="dice-text-effect-type" placeholder="2d20 or 2d10+1d12 or 1d10+3">
        </div>
    </div>
    <div class="effect-setting-container">
        <div class="effect-specific-title"><h4>Should the message display just the sum or include each roll?</h4></div>
        <div style="padding-left: 10px;">
            <label class="control-fb control--radio">Just the sum <span class="muted"><br />Ex: 'ebiggz rolled a 7 on 2d6.'</span>
            <input type="radio" ng-model="effect.resultType" value="sum"/> 
            <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio" >Include each roll <span class="muted"><br />Ex: 'ebiggz rolled a 7 (4, 3) on 2d6.'</span>
            <input type="radio" ng-model="effect.resultType" value="individual"/>
            <div class="control__indicator"></div>
            </label>
        </div>
    </div>
    <div class="effect-info alert alert-info">
        The variable $(user) will be replaced by the username of the person who pressed the button. EX: If Firebottle hits a button you can whisper him.
    </div>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: $scope => {
    // Default result type to 'sum'
        $scope.effect.resultType = $scope.effect.resultType
            ? $scope.effect.resultType
            : "sum";
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.dice == null) {
            errors.push("Please input the number of dice you'd like to roll.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise((resolve, reject) => {
            // What should this do when triggered.
            diceProcessor.send(event.effect, event.trigger);
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
            name: "dice",
            onOverlayEvent: event => {
                console.log("yay dice");
                //need to implement this
            }
        }
    }
};

module.exports = dice;
