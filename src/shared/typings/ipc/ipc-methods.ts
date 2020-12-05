import { FirebotCustomCommand } from "SharedTypes/command";
import { UserProfile } from "SharedTypes/firebot/profile";

export default interface IpcMethods {
    getUserProfiles: () => UserProfile[];
    getActiveUserProfileId: () => string;
    addUserProfile: (name: string) => UserProfile;
    removeUserProfile: (id: string) => void;
    switchToProfile: (id: string) => void;
    renameProfile: (id: string, newName: string) => string;
    getCustomCommands: () => FirebotCustomCommand[];
    saveCustomCommand: (command: FirebotCustomCommand) => void;
    deleteCustomCommand: (id: string) => void;
}
