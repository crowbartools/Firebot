"use strict";

const diceProcessor = require("../../common/handlers/diceProcessor");
const { EffectDependency } = require("../models/effectModels");
const { EffectCategory } = require('../../../shared/effect-constants');

/**
 * The Dice effect
 */
const dice = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:dice",
        name: "Dice",
        description: "Specify an amount of dice to roll in chat.",
        icon: "fad fa-dice",
        categories: [EffectCategory.FUN, EffectCategory.CHAT_BASED],
        dependencies: [EffectDependency.CHAT]
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
    <eos-chatter-select effect="effect" title="Annouce Roll As"></eos-chatter-select>

    <eos-container>
        <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 10px 0 10px; align-items: center;">
            <label class="control-fb control--checkbox" style="margin: 0px 15px 0px 0px"> Whisper
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

    <eos-container header="Roll" pad-top="true">
        <div class="input-group">
            <span class="input-group-addon" id="dice-text-effect-type">Dice</span>
            <input type="text" ng-model="effect.dice" class="form-control" id="dice-text-setting" aria-describedby="dice-text-effect-type" placeholder="2d20 or 2d10+1d12 or 1d10+3" replace-variables>
        </div>
    </eos-container>

    <eos-container header="Display Mode" pad-top="true">
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
    </eos-container>
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
    onTriggerEvent: async event => {
        // What should this do when triggered.
        diceProcessor.send(event.effect, event.trigger);
        return true;
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
