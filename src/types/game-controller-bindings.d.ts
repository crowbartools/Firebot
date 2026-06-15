import type { EffectList } from "./effects";

export type FirebotGameControllerBinding = {
    id: string;
    name: string;
    active: boolean;
    button: number;
    controllerIndex: number | null;
    effects: EffectList;
    sortTags: string[];
};
