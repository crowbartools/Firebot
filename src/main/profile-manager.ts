import { UserProfile } from "SharedTypes/firebot/profile";
import { TypedEmitter } from "tiny-typed-emitter";
import { v4 as uuid } from "uuid";
import globalSettingsConfig from "./settings/global-settings";
import { registerIpcMethods } from "./utils";

class ProfileManager extends TypedEmitter<{
    profileChanged: (profile: UserProfile) => void;
}> {
    private profiles: UserProfile[];

    constructor() {
        super();
        this.profiles = globalSettingsConfig.get("profiles");

        registerIpcMethods(
            this,
            "getUserProfiles",
            "addUserProfile",
            "removeUserProfile",
            "switchToProfile"
        );
    }

    getUserProfiles() {
        return this.profiles;
    }

    addUserProfile(name: string) {
        const newProfile: UserProfile = {
            id: uuid(),
            name,
        };
        this.profiles.push(newProfile);
        globalSettingsConfig.set("profiles", this.profiles);
        return newProfile;
    }

    removeUserProfile(id: string) {
        const index = this.profiles.findIndex((p) => p.id === id);
        if (index > -1) {
            this.profiles.splice(index, 1);
            globalSettingsConfig.set("profiles", this.profiles);
        }
    }

    switchToProfile(id: string) {
        const currentActiveProfileId = globalSettingsConfig.get(
            "activeProfile"
        );

        if (
            currentActiveProfileId != id &&
            this.profiles.some((p) => p.id === id)
        ) {
            globalSettingsConfig.set("activeProfile", id);
            this.emit(
                "profileChanged",
                this.profiles.find((p) => p.id === id)
            );
        }
    }
}

export default new ProfileManager();
