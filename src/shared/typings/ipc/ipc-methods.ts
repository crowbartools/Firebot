import { UserProfile } from "SharedTypes/firebot/profile";

export default interface IpcMethods {
    getUserProfiles: () => UserProfile[];
    addUserProfile: (name: string) => UserProfile;
    removeUserProfile: (id: string) => void;
    switchToProfile: (id: string) => void;
}
