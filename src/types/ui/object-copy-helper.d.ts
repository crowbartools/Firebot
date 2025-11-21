import type { EffectInstance } from "../effects";

export type ObjectCopyHelper = {
    copyEffects: (effects: EffectInstance[]) => void;
    getCopiedEffects: (trigger: TriggerType, triggerMeta: unknown) => Promise<EffectInstance[]>;
    hasCopiedEffects: () => boolean;
    cloneEffect: (effect: EffectInstance) => EffectInstance;
};
