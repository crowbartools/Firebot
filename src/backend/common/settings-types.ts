export type SettingsTypes = {
    AutoFlagBots: boolean;
    WebServerPort: number;
}

// Anything in SettingsTypes not listed here will resolve to "/settings/settingName" (e.g. "/settings/autoFlagBots")
export const SettingsPaths: Partial<Record<keyof SettingsTypes, string>> = {

};

export const SettingsDefaults: SettingsTypes = {
    AutoFlagBots: true,
    WebServerPort: 7472
};