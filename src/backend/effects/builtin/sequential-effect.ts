import type { EffectList, EffectType } from "../../../types/effects";
import effectRunner from "../../common/effect-runner";
import { containsAll } from "../../utils";

interface SequentialQueue {
    queue: string[];
    currentEffectIds: string[];
    lastEffectId?: string;
    outputs?: unknown;
}

const sequentialQueuesCache: Record<string, SequentialQueue> = {};

const effect: EffectType<{
    id: string;
    effectList: EffectList;
    outputs: Record<string, unknown>;
}> = {
    definition: {
        id: "firebot:sequentialeffect",
        name: "Run Sequential Effect",
        description: "Run a single effect sequentially from a list of effects",
        icon: "fad fa-list-ol",
        categories: ["advanced", "scripting"],
        dependencies: []
    },
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
            mode="single-sequential"
            modalId="{{modalId}}"></effect-list>
    </eos-container>
    `,
    optionsController: ($scope) => {
        if ($scope.effect.effectList == null) {
            $scope.effect.effectList = {} as EffectList;
        }

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
            return true;
        }

        const processEffectsRequest = {
            trigger: trigger,
            effects: {
                id: effectList.id,
                list: [chosenEffect],
                queue: effectList.queue
            },
            outputs: outputs
        };

        const result = await effectRunner.processEffects(processEffectsRequest);
        if (result?.success === true) {
            if (result.stopEffectExecution) {
                return {
                    success: true,
                    execution: {
                        stop: true,
                        bubbleStop: true
                    }
                };
            }
        }
        return true;
    }
};

export = effect;