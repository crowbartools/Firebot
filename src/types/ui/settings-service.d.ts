import type { FirebotSettingsTypes } from "../settings";

export type SettingsService = {
    getSetting: <Key extends keyof FirebotSettingsTypes>(key: Key) => FirebotSettingsTypes[Key];
};
