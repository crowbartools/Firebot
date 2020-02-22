"use strict";

const redditProcessor = require("../../common/handlers/redditProcessor");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

const model = {
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
    globalSettings: {},
    optionsTemplate: `
    <eos-container header="Subreddit Name">
        <div class="input-group">
            <span class="input-group-addon" id="reddit-effect-type">To</span>
            <input ng-model="effect.reddit" type="text" class="form-control" id="reddit-setting" aria-describedby="chat-text-effect-type" placeholder="puppies">
        </div>
    </eos-container>

    <eos-container header="Output Location" pad-top="true" ng-if="effect.reddit !== null && effect.reddit !== 'Pick one'">
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
    </eos-container>

    <div class="effect-reddit-settings" ng-if="effect.show === 'chat' || effect.show ==='both'">
        <eos-chatter-select effect="effect" title="Chatter" class="setting-padtop"></eos-chatter-select>
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

    <eos-container pad-top="true">
        <div class="effect-info alert alert-danger">
        Warning: This effect pulls random images from subreddits. Highly moderated subreddits are fairly safe, but there is always the chance of naughty pictures. Just a warning!
        </div>
    </eos-container>
    
    `,
    optionsController: ($scope) => {

        if ($scope.effect.show == null) {
            $scope.effect.show = "chat";
        }

    },
    optionsValidator: effect => {
        let errors = [];
        if (effect.reddit == null) {
            errors.push("Please enter a subreddit.");
        }

        if (effect.show == null) {
            errors.push("Please select a place to show the API results.");
        }
        return errors;
    },
    onTriggerEvent: event => {
        return new Promise(resolve => {
            redditProcessor.go(event.effect);
            resolve(true);
        });
    }
};

module.exports = model;
