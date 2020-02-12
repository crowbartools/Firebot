"use strict";

const effectRunner = require("../../common/effect-runner");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const logger = require("../../logwrapper");

const model = {
    definition: {
        id: "firebot:loopeffects",
        name: "Loop Effects",
        description: "Loop an effect list a given number of times.",
        tags: ["Logic control", "Built in"],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <p>This effect will loop the below effect list the given amount of times.</p>
        </eos-container>

        <eos-container header="Loop Count">
            <input type="text" ng-model="effect.loopCount" class="form-control" replace-variables="number" aria-label="Loop count" placeholder="Enter number">
        </eos-container>

        <eos-container header="Effects To Loop" pad-top="true">
            <effect-list effects="effect.effectList" 
                trigger="{{trigger}}" 
                update="effectListUpdated(effects)"
                header="Effects"
                modalId="{{modalId}}"></effect-list>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: $scope => {
        if ($scope.effect.effectList == null) {
            $scope.effect.effectList = [];
        }

        $scope.effectListUpdated = function(effects) {
            $scope.effect.effectList = effects;
        };
    },
    /**
   * When the effect is saved
   */
    optionsValidator: effect => {
        let errors = [];
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise(async resolve => {

            let effect = event.effect;
            let effectList = effect.effectList;

            if (!effectList || !effectList.list) {
                return resolve(true);
            }

            let loopCount = effect.loopCount && effect.loopCount.trim();
            if (loopCount == null || isNaN(loopCount) || parseInt(loopCount) < 1) {
                loopCount = 1;
            } else {
                loopCount = parseInt(loopCount);
            }

            for (let i = 0; i < loopCount; i++) {
                let processEffectsRequest = {
                    trigger: event.trigger,
                    effects: {
                        id: effectList.id,
                        list: effectList.list,
                        queue: effectList.queue
                    }
                };

                try {
                    await effectRunner.processEffects(processEffectsRequest);
                } catch (err) {
                    logger.warn("failed to run effects in loop effects effect", err);
                }
            }

            resolve(true);
        });
    }
};

module.exports = model;
