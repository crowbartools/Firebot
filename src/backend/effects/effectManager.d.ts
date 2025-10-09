import { EffectType, OverlayExtension } from "../../types/effects";
import { EventEmitter } from "node:events";


declare class EffectManager extends EventEmitter {
    registerEffect: <EffectModel>(effectType: EffectType<EffectModel>) => void;
    unregisterEffect: (effectId: string) => void;
    getEffectById: (effectId: string) => EffectType<unknown> | undefined;
    getEffectOverlayExtensions: () => OverlayExtension[];
    addEventToEffect: (effectId: string, eventSourceId: string, eventId: string) => void;
    removeEventFromEffect: (effectId: string, eventSourceId: string, eventId: string) => void;
}

declare const _EffectManager: EffectManager;
export default _EffectManager;
