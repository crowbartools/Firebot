import { EffectType } from "models/effect-models";

declare class EffectManager {
  registerEffect: <EffectModel>(effectType: EffectType<EffectModel>) => void;
}

declare const _EffectManager: EffectManager;
export default _EffectManager;
