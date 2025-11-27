import type { ReplaceVariable } from "../../../../types/variables";
import twitchRolesManager from "../../../roles/twitch-roles-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "vipArray",
        usage: "vipArray",
        description: "Returns an array of all `VIPs`",
        categories: ["common", "user based"],
        possibleDataOutput: ["array"]
    },
    evaluator: () => {
        try {
            const vips = twitchRolesManager.getVips();
            return vips.map(v => ({
                userId: v.id,
                userName: v.username,
                userDisplayName: v.displayName
            }));
        } catch {
            // Silently fail
        }
        return [];
    }
};
export default model;