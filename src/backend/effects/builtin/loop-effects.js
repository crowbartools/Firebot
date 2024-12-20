"use strict";

const effectRunner = require("../../common/effect-runner");
const { EffectCategory } = require('../../../shared/effect-constants');
const logger = require("../../logwrapper");
const { SettingsManager } = require("../../common/settings-manager");
const conditionManager = require("./conditional-effects/conditions/condition-manager");

const wait = ms => new Promise(r => setTimeout(r, ms));

const model = {
    definition: {
        id: "firebot:loopeffects",
        name: "Loop Effects",
        description: "Loop an effect list",
        icon: "fad fa-repeat-alt",
        categories: [EffectCategory.SCRIPTING],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <p>This effect will loop the below effect list based on the given settings.</p>
        </eos-container>

        <eos-container header="Loop Mode" pad-top="true">
            <div style="padding-left: 10px;">
                <label class="control-fb control--radio">Set Number <span class="muted"><br />Loop a set number of times.</span>
                    <input type="radio" ng-model="effect.loopMode" value="count" ng-change="loopModeChanged()"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio" ng-hide="!whileLoopEnabled && effect.loopMode !== 'conditional'">Conditional <span class="muted"><br />Keep looping while conditions are met</span>
                    <input type="radio" ng-model="effect.loopMode" value="conditional" ng-change="loopModeChanged()"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio" >Iterate Array <span class="muted"><br />Loop through an array. Access the current item with $loopItem</span>
                    <input type="radio" ng-model="effect.loopMode" value="array" ng-change="loopModeChanged()"/>
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container header="{{effect.loopMode === 'count' ? 'Loop Count' : 'Max Loop Count' }}" ng-hide="effect.loopMode === 'array'">
            <p ng-show="effect.loopMode === 'count'" class="muted">The number of times the below effect list should loop.</p>
            <p ng-show="effect.loopMode === 'conditional'" class="muted">The maximum number of loops before forcing the loop to stop, even if conditions are still being met. This is useful for ensuring an infinite loop does not occur. Leave empty to not have a maximum.</p>
            <input type="text" ng-model="effect.loopCount" class="form-control" replace-variables="number" aria-label="Loop count" placeholder="Enter number">
        </eos-container>

        <eos-container header="Array To Iterate" ng-show="effect.loopMode === 'array'" pad-top="true">
            <p class="muted">The JSON array to loop through</p>
            <input type="text" ng-model="effect.arrayToIterate" class="form-control" replace-variables="text" aria-label="Loop Array" placeholder="Enter JSON array">
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

        $scope.whileLoopEnabled = settingsService.getSetting("WhileLoopEnabled");

        if ($scope.effect.effectList == null) {
            $scope.effect.effectList = [];
        }

        if ($scope.effect.loopMode == null) {
            $scope.effect.loopMode = "count";
        }

        $scope.loopModeChanged = () => {
            if ($scope.effect.loopMode === "count") {
                $scope.effect.loopCount = "5";
            } else if ($scope.effect.loopMode === "conditional") {
                $scope.effect.loopCount = "25";
            }
        };

        $scope.effectListUpdated = function(effects) {
            $scope.effect.effectList = effects;
        };
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: (event) => {
        return new Promise(async (resolve) => {

            const { effect, trigger, outputs } = event;
            const effectList = effect.effectList;

            /**
             * @type {AbortSignal}
             */
            const abortSignal = event.abortSignal;

            let lastOutputs = outputs ?? {};

            if (!effectList || !effectList.list || effectList.list.length === 0 || abortSignal.aborted) {
                return resolve(true);
            }

            if (effect.loopMode === 'conditional' && !SettingsManager.getSetting("WhileLoopEnabled")) {
                return resolve(true);
            }

            const runEffects = async (loopCount = 0, loopItem = null, outputs = null) => {
                const trigger = event.trigger;
                trigger.metadata.loopCount = loopCount;
                trigger.metadata.loopItem = loopItem;
                const processEffectsRequest = {
                    trigger: trigger,
                    effects: {
                        id: effectList.id,
                        list: effectList.list,
                        queue: effectList.queue
                    },
                    outputs: outputs
                };

                try {
                    const result = await effectRunner.processEffects(processEffectsRequest);
                    return result;
                } catch (err) {
                    logger.warn("failed to run effects in loop effects effect", err);
                }
                return null;
            };

            if (effect.loopMode === 'count' || effect.loopMode == null) {

                let loopCount = effect.loopCount && effect.loopCount.trim();
                if (loopCount == null || isNaN(loopCount) || parseInt(loopCount) < 1) {
                    loopCount = 1;
                } else {
                    loopCount = parseInt(loopCount);
                }

                for (let i = 0; i < loopCount; i++) {
                    if (abortSignal.aborted) {
                        return resolve(true);
                    }
                    const result = await runEffects(i, null, lastOutputs);
                    lastOutputs = {
                        ...lastOutputs,
                        ...result?.outputs
                    };
                    if (result != null && result.success === true) {
                        if (result.stopEffectExecution) {
                            return resolve({
                                success: true,
                                execution: {
                                    stop: true,
                                    bubbleStop: true
                                }
                            });
                        }
                    }
                }

            } else if (effect.loopMode === 'conditional') {

                let currentLoopCount = 0;
                let maxLoopCount = null;
                if (effect.loopCount && !isNaN(effect.loopCount.trim()) && parseInt(effect.loopCount) > 0) {
                    maxLoopCount = parseInt(effect.loopCount);
                }

                while (true) { //eslint-disable-line no-constant-condition
                    if (abortSignal.aborted) {
                        return resolve(true);
                    }
                    if (effect.conditionData == null || effectList == null) {
                        break;
                    }

                    if (maxLoopCount && currentLoopCount >= maxLoopCount) {
                        break;
                    }

                    if (effect.conditionData == null || effect.conditionData.conditions == null) {
                        break;
                    }

                    const conditionsPass = await conditionManager.runConditions(effect.conditionData, trigger);

                    if (conditionsPass) {
                        const result = await runEffects(currentLoopCount, null, lastOutputs);
                        lastOutputs = {
                            ...lastOutputs,
                            ...result?.outputs
                        };
                        if (result != null && result.success === true) {
                            if (result.stopEffectExecution) {
                                return resolve({
                                    success: true,
                                    execution: {
                                        stop: true,
                                        bubbleStop: true
                                    }
                                });
                            }
                        }
                        await wait(1);
                    } else {
                        break;
                    }
                    currentLoopCount++;
                }
            } else if (effect.loopMode === 'array') {

                let arrayToIterate = effect.arrayToIterate;
                if (typeof arrayToIterate === 'string' || arrayToIterate instanceof String) {
                    try {
                        arrayToIterate = JSON.parse(`${arrayToIterate}`);
                    } catch (error) {
                        logger.error("Failed to parse array to iterate for loop effects", error);
                        return resolve(true);
                    }
                }

                if (!Array.isArray(arrayToIterate)) {
                    logger.error("Array to iterate it not an array.", arrayToIterate);
                    return resolve(true);
                }

                let currentLoopCount = 0;
                for (const item of arrayToIterate) {
                    if (abortSignal.aborted) {
                        return resolve(true);
                    }
                    const result = await runEffects(currentLoopCount, item, lastOutputs);
                    lastOutputs = {
                        ...lastOutputs,
                        ...result?.outputs
                    };
                    if (result != null && result.success === true) {
                        if (result.stopEffectExecution) {
                            return resolve({
                                success: true,
                                execution: {
                                    stop: true,
                                    bubbleStop: true
                                }
                            });
                        }
                    }
                    currentLoopCount++;
                }
            }

            resolve(true);
        });
    }
};

module.exports = model;
