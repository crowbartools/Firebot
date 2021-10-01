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
        return new Promise(resolve => {

            let effect = event.effect;
            let effectList = effect.effectList;

            if (!effectList || !effectList.list) {
                return resolve(true);
            }

            let chosenEffect = null;

            let dontRepeat = effect.dontRepeat;

            // if we shouldnt repeat, we need to use queues
            if (dontRepeat) {

                const containsAll = (arr1, arr2) =>
                    arr2.every(arr2Item => arr1.includes(arr2Item));

                // get array of effect ids in this random effect
                let newEffectIds = effectList.list.map(e => e.id);

                // try to find queue in cache
                let cacheEntry = randomQueuesCache[effect.id];
                if (!cacheEntry) {
                    // we dont have a preexisting queue in the cache, create a new one
                    cacheEntry = {
                        queue: util.shuffleArray(newEffectIds),
                        currentEffectIds: newEffectIds
                    };

                    // add to the cache
                    randomQueuesCache[effect.id] = cacheEntry;
                } else {
                    // theres an existing queue in the cache, check if the effect list has changed at all since last time
                    // and if so, rebuild the queue
                    let effectsHaventChanged = containsAll(newEffectIds, cacheEntry.currentEffectIds);
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
                let chosenEffectId = cacheEntry.queue.shift();
                cacheEntry.lastEffectId = chosenEffectId;
                chosenEffect = effectList.list.find(e => e.id === chosenEffectId);

            } else {
                // we dont care about repeats, just get an effect via random index
                let randomIndex = util.getRandomInt(0, effectList.list.length - 1);
                chosenEffect = effectList.list[randomIndex];

                //removed any cached queues
                if (randomQueuesCache[effect.id]) {
                    delete randomQueuesCache[effect.id];
                }
            }

            if (chosenEffect == null) {
                return resolve(true);
            }

            let processEffectsRequest = {
                trigger: event.trigger,
                effects: {
                    id: effectList.id,
                    list: [chosenEffect],
                    queue: effectList.queue
                }
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

module.exports = randomEffect;
