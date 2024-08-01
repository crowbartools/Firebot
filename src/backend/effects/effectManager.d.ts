import { EffectType, OverlayExtension } from "../../types/effects";
import { EventEmitter } from "node:events";


declare class EffectManager extends EventEmitter {
    registerEffect: <EffectModel>(effectType: EffectType<EffectModel>) => void;
    getEffectById: (effectId: string) => EffectType<unknown> | undefined;
    getEffectOverlayExtensions: () => OverlayExtension[];
}

declare const _EffectManager: EffectManager;
export default _EffectManager;
