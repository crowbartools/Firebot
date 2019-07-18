"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const redditProcessor = require("../../common/handlers/redditProcessor");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

/**
 * The Reddit effect
 */
const reddit = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:randomReddit",
        name: "Random Reddit Image",
        description: "Pulls a random image from a selected subreddit.",
        tags: ["Fun", "API", "Built in"],
        dependencies: [EffectDependency.CHAT],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
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
        <div class="effect-specific-title"><h4>Which subreddit should we pull images from?</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="reddit-effect-type">To</span>
            <input ng-model="effect.reddit" type="text" class="form-control" id="reddit-setting" aria-describedby="chat-text-effect-type" placeholder="puppies">
        </div>
    </div>
    <div class="effect-setting-container" ng-if="effect.reddit !== null && effect.reddit !== 'Pick one'">
        <div class="effect-specific-title"><h4>Where should we send this?</h4></div>
        <div class="controls-fb-inline" style="padding-bottom: 5px;">
            <label class="control-fb control--radio">Chat
                <input type="radio" ng-model="effect.show" value="chat"/> 
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">Overlay
                <input type="radio" ng-model="effect.show" value="overlay"/>
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">Both
                <input type="radio" ng-model="effect.show" value="both"/>
                <div class="control__indicator"></div>
            </label>
        </div>
    </div>

    <div class="effect-reddit-settings" ng-if="effect.show === 'chat' || effect.show ==='both'">
        <eos-chatter-select effect="effect" title="Who should I send this to chat as?"></eos-chatter-select>
    </div>

    <div class="effect-reddit-settings" ng-if="effect.show === 'overlay' || effect.show ==='both'">
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
    Warning: This effect pulls random images from subreddits. Highly moderated subreddits are fairly safe, but there is always the chance of naughty pictures. Just a warning!
    </div>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, listenerService) => {


    },
    /**
   * When the effect is triggered by something
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.reddit == null) {
            errors.push("Please enter a subreddit.");
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
            redditProcessor.go(event.effect);
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
            name: "redditEffect",
            onOverlayEvent: event => {
                // The API Effect can sometimes show images in the overlay.
                // As part of this we use the showImage event.
            }
        }
    }
};

module.exports = reddit;
