import { ProfileConfig } from "../utils/profile-config";

interface ProfileSettings {
    isFirstOpen: boolean;
}

export default new ProfileConfig<ProfileSettings>("settings", {
    isFirstOpen: true,
});
