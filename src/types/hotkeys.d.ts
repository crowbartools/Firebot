import type { EffectList } from "./effects";

export type FirebotHotkey = {
    id: string;
    name: string;
    active: boolean;
    code: Electron.Accelerator;
    warning: string;
    effects: EffectList;
    sortTags: string[];
};