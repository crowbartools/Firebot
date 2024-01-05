import { EffectList } from "./effects";

export type Counter = {
    id?: string;
    name: string;
    value: number;
    saveToTxtFile: boolean;
    minimum?: number;
    maximum?: number;
    updateEffects?: EffectList;
    minimumEffects?: EffectList;
    maximumEffects?: EffectList;
}