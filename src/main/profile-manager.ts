import sanitizeFilename from "sanitize-filename";
import fs from "fs-extra";
import { v4 as uuid } from "uuid";
import path from "path";
import { TypedEmitter } from "tiny-typed-emitter";
import type { UserProfile } from "SharedTypes/firebot/profile";
import globalSettingsConfig from "./settings/global-settings";
import {
    registerIpcMethods,
    getPathInFirebotData,
    emitIpcEvent,
    communicator,
    ensureFirebotDataDirExistsSync,
} from "./utils";

const PROFILES_DIR = "profiles";

@registerIpcMethods(
    "getUserProfiles",
    "addUserProfile",
    "removeUserProfile",
    "switchToProfile",
    "renameProfile"
)
class ProfileManager extends TypedEmitter<{
    activeProfileChanged: (profile: UserProfile) => void;
}> {
    private profiles: UserProfile[];

    constructor() {
        super();
        this.profiles = globalSettingsConfig.get("profiles");

        if (!this.profiles.length) {
            this.addUserProfile("Default Profile");
        }

        communicator.register("getActiveUserProfileId", async () =>
            globalSettingsConfig.get("activeProfile") ?? ""
        );
    }

    get activeProfile() {
        return this.profiles.find(
            (p) => p.id === globalSettingsConfig.get("activeProfile")
        );
    }

    @emitIpcEvent("activeProfileChanged")
    private setActiveProfile(profile: UserProfile) {
        globalSettingsConfig.set("activeProfile", profile.id);
        this.emit("activeProfileChanged", profile);
    }

    getUserProfiles() {
        return this.profiles;
    }

    addUserProfile(name: string) {
        name = sanitizeFilename(name);
        const newProfile: UserProfile = {
            id: uuid(),
            name,
        };

        ensureFirebotDataDirExistsSync(path.join(PROFILES_DIR, name));

        if (!this.profiles.length) {
            this.setActiveProfile(newProfile);
        }
        this.profiles.push(newProfile);
        globalSettingsConfig.set("profiles", this.profiles);
        return newProfile;
    }

    async renameProfile(id: string, newName: string) {
        const profile = this.profiles.find((p) => p.id === id);
        if (!profile) {
            return new Error(`Profile ${id} doesn't exist`);
        }

        newName = sanitizeFilename(newName);
        const oldName = profile.name;

        profile.name = newName;

        globalSettingsConfig.set("profiles", this.profiles);

        const oldProfilePath = getPathInFirebotData(
            path.join(PROFILES_DIR, oldName)
        );
        const newProfilePath = getPathInFirebotData(
            path.join(PROFILES_DIR, profile.name)
        );

        await fs.rename(oldProfilePath, newProfilePath);

        return newName;
    }

    async removeUserProfile(id: string) {
        const index = this.profiles.findIndex((p) => p.id === id);
        if (index > -1 && this.profiles.length > 1) {
            const profile = this.profiles[index];
            this.profiles.splice(index, 1);
            globalSettingsConfig.set("profiles", this.profiles);
            await fs.remove(
                getPathInFirebotData(path.join(PROFILES_DIR, profile.name))
            );
        }
    }

    switchToProfile(id: string) {
        const currentActiveProfileId = globalSettingsConfig.get(
            "activeProfile"
        );
        const profile = this.profiles.find((p) => p.id === id);
        if (currentActiveProfileId != id && !!profile) {
            this.setActiveProfile(profile);
        }
    }
}

export default new ProfileManager();
