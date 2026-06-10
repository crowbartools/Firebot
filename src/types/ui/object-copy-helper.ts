import type { EffectInstance } from "../effects";
import type { TriggerType } from "../triggers";

export type ObjectCopyHelper = {
    copyEffects: (effects: EffectInstance[]) => void;
    getCopiedEffects: (trigger: TriggerType, triggerMeta: unknown) => Promise<EffectInstance[]>;
    hasCopiedEffects: () => boolean;
    cloneEffect: (effect: EffectInstance) => EffectInstance;
    copyAndReplaceIds<T>(obj: T): T;
};
