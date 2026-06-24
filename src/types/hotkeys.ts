import type { EffectList } from "./effects";

export type FirebotHotkey = {
    id: string;
    name: string;
    active: boolean;
    // Electron accelerator string (see https://www.electronjs.org/docs/latest/api/accelerator)
    code: string;
    warning: string;
    effects: EffectList;
    sortTags: string[];
};