type EffectAbortData = {
    executionId: string;
    abortController: AbortController;
};

const effectListAbortCache: Record<string, EffectAbortData[]> = {};

const effectAbortCache: Record<string, EffectAbortData[]> = {};

export function addEffectAbortController(
    type: "effect" | "effect-list",
    effectOrEffectListId: string,
    abortData: EffectAbortData
) {
    const cache = type === "effect" ? effectAbortCache : effectListAbortCache;
    if (cache[effectOrEffectListId] == null) {
        cache[effectOrEffectListId] = [];
    }
    cache[effectOrEffectListId].push(abortData);
}

export function removeEffectAbortController(
    type: "effect" | "effect-list",
    effectOrEffectListId: string,
    executionId: string
) {
    const cache = type === "effect" ? effectAbortCache : effectListAbortCache;
    if (cache[effectOrEffectListId] == null) {
        return;
    }
    cache[effectOrEffectListId] = cache[effectOrEffectListId].filter(data =>
        data.executionId !== executionId);
}

export function abortEffectList(effectListId: string, bubbleStop?: boolean) {
    if (effectListAbortCache[effectListId] == null) {
        return;
    }
    effectListAbortCache[effectListId].forEach((data) => {
        data.abortController.abort({
            message: "Effect list aborted manually",
            bubbleStop
        });
    });
    delete effectListAbortCache[effectListId];
}

export function abortEffect(effectId: string) {
    if (effectAbortCache[effectId] == null) {
        return;
    }
    effectAbortCache[effectId].forEach((data) => {
        data.abortController.abort();
    });
    delete effectAbortCache[effectId];
}

export function abortAllEffectLists(bubbleStop?: boolean) {
    Object.keys(effectListAbortCache).forEach((effectListId) => {
        abortEffectList(effectListId, bubbleStop);
    });
}
