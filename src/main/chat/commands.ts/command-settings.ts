import { FirebotCustomCommand } from "SharedTypes/command";
import { ProfileConfig } from "../../utils/profile-config";

interface CommandSettings {
    customCommands: FirebotCustomCommand[];
}

export default new ProfileConfig<CommandSettings>("commands", {
    customCommands: [],
});
