"use strict";

const effectRunner = require("../../common/effect-runner");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const logger = require("../../logwrapper");

const { settings } = require("../../common/settings-access");

const conditionManager = require("./conditional-effects/conditions/condition-manager");

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const model = {
    definition: {
        id: "firebot:loopeffects",
        name: "Loop Effects",
        description: "Loop an effect list",
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
            <p>This effect will loop the below effect list based on the given settings.</p>
        </eos-container>

        <eos-container header="Loop Mode" pad-top="true" ng-hide="!whileLoopEnabled && effect.loopMode === 'count'">
            <div style="padding-left: 10px;">
                <label class="control-fb control--radio">Set Number <span class="muted"><br />Loop a set number of times.</span>
                    <input type="radio" ng-model="effect.loopMode" value="count" ng-change="loopModeChanged()"/> 
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio" >Conditional <span class="muted"><br />Keep looping while conditions are met</span>
                    <input type="radio" ng-model="effect.loopMode" value="conditional" ng-change="loopModeChanged()"/>
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container header="{{effect.loopMode === 'count' ? 'Loop Count' : 'Max Loop Count' }}" header="Loop Mode" >
            <p ng-show="effect.loopMode === 'count'">The number of times the below effect list should loop.</p>
            <p ng-show="effect.loopMode === 'conditional'">The maximum number of loops before forcing the loop to stop, even if conditions are still being met. This is useful for ensuring an infinite loop does not occur. Leave empty to not have a maximum.</p>
            <input type="text" ng-model="effect.loopCount" class="form-control" replace-variables="number" aria-label="Loop count" placeholder="Enter number">
        </eos-container>

        <eos-container header="Effects To Loop" pad-top="true">
            <div ng-show="effect.loopMode === 'conditional'">
                <condition-list condition-data="effect.conditionData" prefix="While" trigger="trigger" trigger-meta="triggerMeta"></condition-list>
                <div style="font-size: 15px;font-family: 'Quicksand'; color: #c0c1c2;margin-bottom:3px;">Run the following effects:</div>
            </div>

            <effect-list effects="effect.effectList" 
                trigger="{{trigger}}" 
                trigger-meta="triggerMeta"
                update="effectListUpdated(effects)"
                modalId="{{modalId}}"></effect-list> 
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, settingsService) => {

        $scope.whileLoopEnabled = settingsService.getWhileLoopEnabled();

        if ($scope.effect.effectList == null) {
            $scope.effect.effectList = [];
        }

        if ($scope.effect.loopMode == null) {
            $scope.effect.loopMode = "count";
        }

        $scope.loopModeChanged = () => {
            if ($scope.effect.loopMode === "count") {
                $scope.effect.loopCount = 5;
            } else {
                $scope.effect.loopCount = 25;
            }
        };

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

            let { effect, trigger } = event;
            let effectList = effect.effectList;

            if (!effectList || !effectList.list) {
                return resolve(true);
            }

            if (effect.loopMode === 'conditional' && !settings.getWhileLoopEnabled()) {
                return resolve(true);
            }

            let runEffects = async () => {
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
            };

            if (effect.loopMode === 'count' || effect.loopMode == null) {

                let loopCount = effect.loopCount && effect.loopCount.trim();
                if (loopCount == null || isNaN(loopCount) || parseInt(loopCount) < 1) {
                    loopCount = 1;
                } else {
                    loopCount = parseInt(loopCount);
                }

                for (let i = 0; i < loopCount; i++) {
                    await runEffects();
                }

            } else if (effect.loopMode === 'conditional') {

                let currentLoopCount = 0;
                let maxLoopCount = null;
                if (effect.loopCount && !isNaN(effect.loopCount.trim()) && parseInt(effect.loopCount) > 0) {
                    maxLoopCount = parseInt(effect.loopCount);
                }

                while (true) { //eslint-disable-line no-constant-condition
                    if (effect.conditionData == null || effectList == null) break;

                    if (maxLoopCount && currentLoopCount >= maxLoopCount) break;

                    if (effect.conditionData == null || effect.conditionData.conditions == null) break;

                    let conditionsPass = await conditionManager.runConditions(effect.conditionData, trigger);

                    if (conditionsPass) {
                        await runEffects();
                        await wait(1);
                    } else {
                        break;
                    }
                    currentLoopCount++;
                }
            }



            resolve(true);
        });
    }
};

module.exports = model;
