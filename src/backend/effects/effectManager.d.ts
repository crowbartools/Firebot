import { EffectType } from "../../types/effects";

declare class EffectManager {
    registerEffect: <EffectModel>(effectType: EffectType<EffectModel>) => void;
    getEffectById: (effectId: string) => EffectType<unknown> | undefined;
}

declare const _EffectManager: EffectManager;
export default _EffectManager;
