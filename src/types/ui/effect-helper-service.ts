import type { EffectType } from "../effects";

export type EffectHelperService = {
    getAllEffectTypes: () => Promise<EffectType[]>;
};