import { UserProfile } from "SharedTypes/firebot/profile";

export default interface IpcMethods {
    getUserProfiles: {
        request: undefined;
        response: UserProfile[];
    };
    addUserProfile: {
        request: {
            name: string;
        };
        response: UserProfile;
    };
    removeUserProfile: {
        request: {
            id: string;
        };
        response: void;
    };
    switchToProfile: {
        request: {
            id: string;
        };
        response: void;
    };
    testMethod: {
        request: {
            foo: string;
        };
        response: {
            bar: boolean;
        };
    };
}
