import { makeAutoObservable } from "mobx";
import { UserProfile } from "SharedTypes/firebot/profile";
import { communicator } from "../utils";
class UserProfilesStore {
    profiles: UserProfile[] = [];
    activeProfileId: string = null;

    constructor() {
        makeAutoObservable(this);

        this.getProfiles();

        communicator.invoke("getActiveUserProfileId").then((id) => {
            this.setActiveProfileId(id);
        });
        communicator.on("activeProfileChanged", (profile) => {
            this.setActiveProfileId(profile.id);
        });
    }

    get activeProfile(): UserProfile {
        return this.profiles.find((p) => p.id === this.activeProfileId);
    }

    private *getProfiles() {
        this.profiles = yield communicator.invoke("getUserProfiles");
    }

    private setActiveProfileId(id: string) {
        this.activeProfileId = id;
    }
}

export const profilesStore = new UserProfilesStore();
