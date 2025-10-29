import type { FirebotParamCategory } from "./parameters";

export type GameSettings = {
    active: boolean;
    settings?: Record<string, Record<string, unknown>>;
};

export type GameDefinition = {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    icon: string;
    active?: boolean;
    settingCategories: Record<string, FirebotParamCategory<Record<string, unknown>>>;
};

export type FirebotGame = GameDefinition & {
    onLoad: (settings: GameSettings) => void;
    onUnload: (settings: GameSettings) => void;
    onSettingsUpdate: (settings: GameSettings) => void;
};