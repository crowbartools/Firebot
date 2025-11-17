export type PlatformService = {
    platform: NodeJS.Platform;
    isMacOs: boolean;
    isWindows: boolean;
    isLinux: boolean;
    loadPlatform: () => void;
};