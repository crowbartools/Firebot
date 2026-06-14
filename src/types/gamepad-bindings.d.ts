import type { EffectList } from "./effects";

export type FirebotGamepadBinding = {
    id: string;
    name: string;
    active: boolean;
    button: number;
    gamepadIndex: number | null;
    effects: EffectList;
    sortTags: string[];
};
