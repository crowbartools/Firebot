import { EffectInstance, EffectList } from "../../types";
import { EffectManager } from "../effects/effect-manager";
import { containsAll, getRandomInt, shuffleArray } from "../utils";
import logger from "../logwrapper";

interface CacheEntry {
    /**
     * The queue of effect IDs to be executed in order
     */
    queue: string[];
    /**
     * The current set of effect IDs in the effect list, used to determine if the effect list has changed since last execution
     */
    currentEffectIds: string[];
    /**
     * The last effect ID that was executed from this list
     */
    lastEffectId?: string;
}

type EffectListCache = Record<string, CacheEntry>;

const sequentialCache: EffectListCache = {};
const randomCache: EffectListCache = {};

function getEntryFromCache(effectListId: string, effectIds: string[], cache: EffectListCache, shuffle: boolean): CacheEntry {

    // try to find queue in cache
    let cacheEntry = cache[effectListId];
    if (!cacheEntry) {
        // we don't have a preexisting queue in the cache, create a new one
        cacheEntry = {
            queue: shuffleArray(effectIds),
            currentEffectIds: effectIds
        };

        // add to the cache
        cache[effectListId] = cacheEntry;
    } else {
        // theres an existing queue in the cache, check if the effect list has changed at all since last time
        // and if so, rebuild the queue
        const effectsHaventChanged = containsAll(effectIds, cacheEntry.currentEffectIds);
        if (!effectsHaventChanged) {
            cacheEntry.queue = shuffle ? shuffleArray(effectIds) : effectIds;
            cacheEntry.currentEffectIds = effectIds;
        }
    }

    // if empty, we need to rebuild the queue
    if (cacheEntry.queue.length === 0) {
        if (shuffle) {
            if (effectIds.length > 1) {
                let shuffledEffectIds: string[] = [];

                // keep shuffling until we get a different first effect than the last played effect
                do {
                    shuffledEffectIds = shuffleArray(effectIds);
                } while (cacheEntry.lastEffectId && shuffledEffectIds[0] === cacheEntry.lastEffectId);

                cacheEntry.queue = shuffledEffectIds;
            } else {
                // if we don't have more than one effect, there is nothing to shuffle
                cacheEntry.queue = effectIds;
            }
        } else {
            cacheEntry.queue = effectIds;
        }
    }

    return cacheEntry;
}

function getValidEffects(effectList: EffectList): EffectInstance[] {
    return effectList.list.filter((e) => {
        if (e.active != null && !e.active) {
            return false;
        }
        const effectType = EffectManager.getEffectById(e.type);
        return effectType?.definition?.isNoOp !== true;
    });
}

function getSequentialEffect(effectList: EffectList): EffectInstance | null {
    const validEffects = getValidEffects(effectList);

    if (!validEffects.length) {
        return null;
    }

    const effectIds = validEffects.map(e => e.id);

    const cacheEntry = getEntryFromCache(effectList.id, effectIds, sequentialCache, false);

    // gets the next effect from beginning of queue and removes it
    const nextEffectId = cacheEntry.queue.shift();
    cacheEntry.lastEffectId = nextEffectId;

    return effectList.list.find(e => e.id === nextEffectId);
}

function getRandomEffect(effectList: EffectList): EffectInstance | null {
    const validEffects = getValidEffects(effectList);

    if (!validEffects.length) {
        return null;
    }

    let chosenEffect: EffectInstance | null = null;

    const dontRepeat = effectList.dontRepeatUntilAllUsed === true;
    const weighted = effectList.weighted === true;

    if (weighted) {
        const sumOfAllWeights = validEffects.reduce((acc, e) => acc + (e.percentWeight ?? 0.5), 0);
        const effectsWithPercentages = validEffects.map(e => ({
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
        // if we shouldnt repeat, we need to use the cache to queue effects

        // get array of effect ids in this random effect
        const effectIds = validEffects.map(e => e.id);

        // try to find queue in cache
        const cacheEntry = getEntryFromCache(effectList.id, effectIds, randomCache, true);

        // gets the next effect from beginning of queue and removes it
        const chosenEffectId = cacheEntry.queue.shift();
        cacheEntry.lastEffectId = chosenEffectId;
        chosenEffect = effectList.list.find(e => e.id === chosenEffectId);

    } else {
        // we don't care about repeats, just get an effect via random index
        const randomIndex = getRandomInt(0, validEffects.length - 1);
        chosenEffect = validEffects[randomIndex];
    }

    //removed any cached entries if we are no longer using them
    if ((weighted || !dontRepeat) && randomCache[effectList.id]) {
        delete randomCache[effectList.id];
    }

    return chosenEffect;
}

export function resolveEffectsForExecution(effectList: EffectList): EffectInstance[] {
    const mode = effectList.runMode ?? "all";
    if (mode === "all") {
        return effectList.list;
    }
    if (mode === "sequential") {
        const nextEffect = getSequentialEffect(effectList);
        return nextEffect ? [nextEffect] : [];
    }
    if (mode === "random") {
        const nextEffect = getRandomEffect(effectList);
        return nextEffect ? [nextEffect] : [];
    }
    return [];
}

