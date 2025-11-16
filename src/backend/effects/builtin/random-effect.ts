import type { EffectList, EffectType } from "../../../types/effects";

import effectRunner from "../../common/effect-runner";
import logger from "../../logwrapper";
import { getRandomInt, shuffleArray, containsAll } from "../../utils";

const randomQueuesCache: Record<string, {
    queue: string[];
    currentEffectIds: string[];
    lastEffectId?: string;
}> = {};

const effect: EffectType<{
    effectList: EffectList;
    weighted: boolean;
    dontRepeat: boolean;
    bubbleOutputs: boolean;
    outputs: unknown;
}> = {
    definition: {
        id: "firebot:randomeffect",
        name: "Run Random Effect",
        description: "Run a random effect from a list of effects",
        icon: "fad fa-random",
        categories: ["advanced", "scripting"]
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect will run a random effect from the list below.</p>

            <div style="padding-top: 10px;">
                <firebot-checkbox
                    model="effect.weighted"
                    label="Weighted Chances"
                    tooltip="If checked, the effects chances are determined by their weight value. If unchecked, each effect will have an equal chance of being selected."
                    style="margin-bottom: 0"
                />
            </div>
        </eos-container>

        <eos-container pad-top="true">
            <effect-list effects="effect.effectList"
                trigger="{{trigger}}"
                trigger-meta="triggerMeta"
                update="effectListUpdated(effects)"
                header="Effects"
                modalId="{{modalId}}"
                hide-numbers="true"
                weighted="effect.weighted"
            ></effect-list>
        </eos-container>

        <eos-container header="Options" pad-top="true">
            <firebot-checkbox
                ng-hide="effect.weighted"
                model="effect.dontRepeat"
                label="Don't Repeat"
                tooltip="If checked, each effect in this list will be played once before the list is shuffled again, preventing the same effect from repeating successively."
            />
            <firebot-checkbox
                model="effect.bubbleOutputs"
                label="Apply effect outputs to parent list"
                tooltip="Whether or not you want any effect outputs to be made available to the parent effect list."
            />
        </eos-container>
    `,
    optionsController: ($scope) => {
        $scope.effectListUpdated = (effects: EffectList) => {
            $scope.effect.effectList = effects;
        };
    },
    onTriggerEvent: async ({ effect, trigger }) => {
        const effectList = effect.effectList;
        const outputs = effect.outputs;

        if (!effectList || !effectList.list) {
            return true;
        }

        const enabledEffectList = effectList.list.filter(e => (e.active == null || !!e.active));
        if (!enabledEffectList.length) {
            return true;
        }

        let chosenEffect = null;

        const dontRepeat = effect.dontRepeat;

        if (effect.weighted) {
            const sumOfAllWeights = enabledEffectList.reduce((acc, e) => acc + (e.percentWeight ?? 0.5), 0);
            const effectsWithPercentages = enabledEffectList.map(e => ({
                effect: e,
                chance: ((e.percentWeight ?? 0.5) / sumOfAllWeights) * 100
            }));

            const min = 0.0001, max = 100.0;
            const random = Math.random() * (max - min) + min;

            logger.debug("Random effect chance roll: ", random);

            let currentChance = 0;
            for (let i = 0; i < effectsWithPercentages.length; i++) {
                const effectWithPercentage = effectsWithPercentages[i];
                currentChance += effectWithPercentage.chance;
                if (random <= currentChance) {
                    chosenEffect = effectWithPercentage.effect;
                    break;
                }
            }
        } else if (dontRepeat) {
            // if we shouldnt repeat, we need to use queues

            // get array of effect ids in this random effect
            const newEffectIds = enabledEffectList.map(e => e.id);

            // try to find queue in cache
            let cacheEntry = randomQueuesCache[effect.id];
            if (!cacheEntry) {
                // we don't have a preexisting queue in the cache, create a new one
                cacheEntry = {
                    queue: shuffleArray(newEffectIds),
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
                    cacheEntry.queue = shuffleArray(newEffectIds);
                }
            }


            if (cacheEntry.queue.length === 0) {
                // We need to make a new queue
                let newShuffle: string[] = [];
                if (newEffectIds.length < 2) {
                    newShuffle = shuffleArray(newEffectIds);
                } else {
                    do {
                        newShuffle = shuffleArray(newEffectIds);
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
            const randomIndex = getRandomInt(0, enabledEffectList.length - 1);
            chosenEffect = enabledEffectList[randomIndex];

            //removed any cached queues
            if (randomQueuesCache[effect.id]) {
                delete randomQueuesCache[effect.id];
            }
        }

        if (chosenEffect == null) {
            return true;
        }

        const processEffectsRequest = {
            trigger,
            effects: {
                id: effectList.id,
                list: [chosenEffect],
                queue: effectList.queue
            },
            outputs
        };

        const result = await effectRunner.processEffects(processEffectsRequest);

        if (result != null && result.success === true) {
            if (result.stopEffectExecution) {
                return {
                    success: true,
                    outputs: effect.bubbleOutputs ? result.outputs : undefined,
                    execution: {
                        stop: true,
                        bubbleStop: true
                    }
                };
            }
        }

        return {
            success: true,
            outputs: effect.bubbleOutputs ? result?.outputs : undefined
        };
    }
};

export = effect;