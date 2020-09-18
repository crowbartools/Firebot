import { UserProfile } from "SharedTypes/firebot/profile";

export default interface IpcMethods {
    testMethod: (foo: string) => { bar: boolean };
    getUserProfiles: () => UserProfile[];
    addUserProfile: (name: string) => UserProfile;
    removeUserProfile: (id: string) => void;
    switchToProfile: (id: string) => void;
}
