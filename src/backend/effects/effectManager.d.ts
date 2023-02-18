import { EffectType } from "../../types/effects";

declare class EffectManager {
  registerEffect: <EffectModel>(effectType: EffectType<EffectModel>) => void;
}

declare const _EffectManager: EffectManager;
export default _EffectManager;
