import type { PresetEffectList } from "../effects";

export type PresetEffectListsService = {
    presetEffectLists: PresetEffectList[];
    loadPresetEffectLists: () => void;
    getPresetEffectLists: () => PresetEffectList[];
    getPresetEffectList: (presetEffectListId: string) => PresetEffectList | undefined;
    savePresetEffectList: (presetEffectList: PresetEffectList, isNew?: boolean) => PresetEffectList | null;
    saveAllPresetEffectLists: (presetEffectLists: PresetEffectList[]) => void;
    presetEffectListNameExists: (name: string) => boolean;
    showRunPresetListModal: (id: string, isQuickAction?: boolean) => void;
    manuallyTriggerPresetEffectList: (
        presetEffectListId: string,
        args?: Record<string, unknown>,
        isQuickAction?: boolean
    ) => void;
    duplicatePresetEffectList: (presetEffectListId: string) => void;
    deletePresetEffectList: (presetEffectListId: string) => void;
    showAddEditPresetEffectListModal: (presetEffectList?: Partial<PresetEffectList>) => Promise<PresetEffectList | null>;
};
