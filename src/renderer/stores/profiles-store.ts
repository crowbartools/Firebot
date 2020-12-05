import { observable, action, computed } from "mobx";
import { actionAsync, task } from "mobx-utils";
import { UserProfile } from "SharedTypes/firebot/profile";
import { communicator } from "../utils";
class UserProfilesStore {
    @observable profiles: UserProfile[] = [];
    @observable activeProfileId: string = null;

    constructor() {
        this.getProfiles();

        communicator.invoke("getActiveUserProfileId").then((id) => {
            this.setActiveProfileId(id);
        });
        communicator.on("activeProfileChanged", (profile) => {
            this.setActiveProfileId(profile.id);
        });
    }

    @computed
    get activeProfile(): UserProfile {
        return this.profiles.find((p) => p.id === this.activeProfileId);
    }

    @actionAsync
    private async getProfiles() {
        this.profiles = await task(communicator.invoke("getUserProfiles"));
    }

    @action.bound
    private setActiveProfileId(id: string) {
        this.activeProfileId = id;
    }
}

export const profilesStore = new UserProfilesStore();
