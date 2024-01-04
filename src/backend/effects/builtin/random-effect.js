"use strict";

const effectRunner = require("../../common/effect-runner");
const util = require("../../utility");
const { EffectCategory } = require('../../../shared/effect-constants');

const randomQueuesCache = {};

/**
 * The Random Effect effect
 */
const randomEffect = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:randomeffect",
        name: "Run Random Effect",
        description: "Run a random effect from a list of effects",
        icon: "fad fa-random",
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
        <p>This effect will run a random effect from the list below.</p>

        <div style="padding-top: 10px;">
            <label class="control-fb control--checkbox"> Don't Repeat <tooltip text="'If checked, each effect in this list will be played once before the list is shuffled again, preventing the same effect from repeating successively.'"></tooltip>
                <input type="checkbox" ng-model="effect.dontRepeat">
                <div class="control__indicator"></div>
            </label>
        </div>
    </eos-container>

    <eos-container pad-top="true">
        <effect-list effects="effect.effectList"
            trigger="{{trigger}}"
            trigger-meta="triggerMeta"
            update="effectListUpdated(effects)"
            header="Effects"
            modalId="{{modalId}}"
            hide-numbers="true"></effect-list>
    </eos-container>

    <eos-container header="Options" pad-top="true">
        <firebot-checkbox
            model="effect.bubbleOutputs"
            label="Apply effect outputs to parent list"
            tooltip="Whether or not you want any effect outputs to be made available to the parent effect list."
        />
    </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: $scope => {

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

            const dontRepeat = effect.dontRepeat;

            // if we shouldnt repeat, we need to use queues
            if (dontRepeat) {

                const containsAll = (arr1, arr2) =>
                    arr2.every(arr2Item => arr1.includes(arr2Item));

                // get array of effect ids in this random effect
                const newEffectIds = enabledEffectList.map(e => e.id);

                // try to find queue in cache
                let cacheEntry = randomQueuesCache[effect.id];
                if (!cacheEntry) {
                    // we don't have a preexisting queue in the cache, create a new one
                    cacheEntry = {
                        queue: util.shuffleArray(newEffectIds),
                        currentEffectIds: newEffectIds
                    };

                    // add to the cache
                    randomQueuesCache[effect.id] = cacheEntry;
                } else {
                    // theres an existing queue in the cache, check if the effect list has changed at all since last time
                    // and if so, rebuild the queue
                    const effectsHaventChanged = containsAll(newEffectIds, cacheEntry.currentEffectIds);
                    if (!effectsHaventChanged) {
                        cacheEntry.currentEffectIds = newEffectIds;
                        cacheEntry.queue = util.shuffleArray(newEffectIds);
                    }
                }


                if (cacheEntry.queue.length === 0) {
                    // We need to make a new queue
                    let newShuffle = [];
                    if (newEffectIds.length < 2) {
                        newShuffle = util.shuffleArray(newEffectIds);
                    } else {
                        do {
                            newShuffle = util.shuffleArray(newEffectIds);
                        } while (cacheEntry.lastEffectId && newShuffle[0] === cacheEntry.lastEffectId);
                        cacheEntry.queue = newShuffle;
                    }
                }

                // gets the next effect from beginning of queue and removes it
                const chosenEffectId = cacheEntry.queue.shift();
                cacheEntry.lastEffectId = chosenEffectId;
                chosenEffect = effectList.list.find(e => e.id === chosenEffectId);

            } else {
                // we don't care about repeats, just get an effect via random index
                const randomIndex = util.getRandomInt(0, enabledEffectList.length - 1);
                chosenEffect = enabledEffectList[randomIndex];

                //removed any cached queues
                if (randomQueuesCache[effect.id]) {
                    delete randomQueuesCache[effect.id];
                }
            }

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
                                outputs: effect.bubbleOutputs ? result.outputs : undefined,
                                execution: {
                                    stop: true,
                                    bubbleStop: true
                                }
                            });
                        }
                    }
                    resolve({
                        success: true,
                        outputs: effect.bubbleOutputs ? result?.outputs : undefined
                    });
                });
        });
    }
};

module.exports = randomEffect;
