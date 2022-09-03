import { Effects } from "@crowbartools/firebot-custom-scripts-types/types/effects";
import EffectType = Effects.EffectType;

declare class EffectManager {
  registerEffect: <EffectModel>(effectType: EffectType<EffectModel>) => void;
}

declare const _EffectManager: EffectManager;
export default _EffectManager;
