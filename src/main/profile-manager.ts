import { v4 as uuid } from "uuid";
import globalSettingsConfig from "./settings/global-settings";
import { communicator } from "./utils";

const profiles = globalSettingsConfig.get("profiles");

export function getUserProfiles() {
    return profiles;
}

export function addUserProfile(name: string) {
    const newProfile = {
        id: uuid(),
        name,
    };
    profiles.push(newProfile);
    globalSettingsConfig.set("profiles", profiles);
    return newProfile;
}

export function removeUserProfile(id: string) {
    const index = profiles.findIndex((p) => p.id === id);
    if (index > -1) {
        profiles.splice(index, 1);
        globalSettingsConfig.set("profiles", profiles);
    }
}

export function switchUserProfiles(id: string) {
    const currentActiveProfileId = globalSettingsConfig.get("activeProfile");

    if (currentActiveProfileId != id && profiles.some((p) => p.id === id)) {
        globalSettingsConfig.set("activeProfile", id);
    }
}

communicator.register("getUserProfiles", async () => {
    return profiles;
});

communicator.register("addUserProfile", async ({ name }) => {
    return addUserProfile(name);
});

communicator.register("removeUserProfile", async ({ id }) => {
    removeUserProfile(id);
});

communicator.register("switchToProfile", async ({ id }) => {
    switchUserProfiles(id);
});
