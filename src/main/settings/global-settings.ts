import { FbConfig } from "../utils/fb-config";

interface GlobalSettings {
    debugMode: boolean;
    activeProfile: string;
    profiles: Array<{
        id: string;
        name: string;
    }>;
}

const globalSettingsConfig = new FbConfig<GlobalSettings>("global-settings", {
    debugMode: false,
    activeProfile: null,
    profiles: [],
});
