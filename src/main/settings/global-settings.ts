import { UserProfile } from "SharedTypes/firebot/profile";
import { FbConfig } from "../utils/fb-config";

interface GlobalSettings {
    debugMode: boolean;
    activeProfile?: string;
    profiles: Array<UserProfile>;
}
export default new FbConfig<GlobalSettings>("global-settings", {
    debugMode: false,
//    activeProfile: null,
    profiles: [],
});
