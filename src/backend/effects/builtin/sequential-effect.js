"use strict";

const effectRunner = require("../../common/effect-runner");
const { EffectCategory } = require('../../../shared/effect-constants');
const sequentialQueuesCache = {};

const model = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:sequentialeffect",
        name: "Run Sequential Effect",
        description: "Run a single effect sequentially from a list of effects",
        icon: "fad fa-list-ol",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: []
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


    <eos-container>
        <p>This effect will run a single effect sequentially from the list below. Particularly useful in Timers!</p>
    </eos-container>

    <eos-container pad-top="true">
        <effect-list effects="effect.effectList"
            trigger="{{trigger}}"
            trigger-meta="triggerMeta"
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
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise(resolve => {

            const effect = event.effect;
            const effectList = effect.effectList;
            const outputs = effect.outputs;

            if (!effectList || !effectList.list) {
                return resolve(true);
            }

            const enabledEffectList = effectList.list.filter(e => (e.active == null || !!e.active));
            if (!enabledEffectList.length) {
                return resolve(true);
            }

            let chosenEffect = null;

            const containsAll = (arr1, arr2) =>
                arr2.every(arr2Item => arr1.includes(arr2Item));

            // get array of effect ids in this seq effect
            const newEffectIds = enabledEffectList.map(e => e.id);

            // try to find queue in cache
            let cacheEntry = sequentialQueuesCache[effect.id];
            if (!cacheEntry) {
                // we don't have a preexisting queue in the cache, create a new one
                cacheEntry = {
                    queue: newEffectIds,
                    currentEffectIds: newEffectIds
                };

                // add to the cache
                sequentialQueuesCache[effect.id] = cacheEntry;
            } else {
                // theres an existing queue in the cache, check if the effect list has changed at all since last time
                // and if so, rebuild the queue
                const effectsHaventChanged = containsAll(newEffectIds, cacheEntry.currentEffectIds);
                if (!effectsHaventChanged) {
                    cacheEntry.currentEffectIds = newEffectIds;
                    cacheEntry.queue = newEffectIds;
                }
            }


            if (cacheEntry.queue.length === 0) {
                // We need to make a new queue
                cacheEntry.queue = newEffectIds;
            }

            // gets the next effect from beginning of queue and removes it
            const chosenEffectId = cacheEntry.queue.shift();
            cacheEntry.lastEffectId = chosenEffectId;
            chosenEffect = effectList.list.find(e => e.id === chosenEffectId);

            if (chosenEffect == null) {
                return resolve(true);
            }

            const processEffectsRequest = {
                trigger: event.trigger,
                effects: {
                    id: effectList.id,
                    list: [chosenEffect],
                    queue: effectList.queue
                },
                outputs: outputs
            };

            effectRunner.processEffects(processEffectsRequest)
                .then(result => {
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
                    resolve(true);
                });
        });
    }
};

module.exports = model;
