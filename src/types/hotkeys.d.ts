import type { EffectList } from "./effects";

export type FirebotHotkey = {
    id: string;
    code: Electron.Accelerator;
    active: boolean;
    effects: EffectList;
};