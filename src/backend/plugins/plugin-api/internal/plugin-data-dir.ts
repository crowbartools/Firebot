import path from "path";
import { ProfileManager } from "../../../common/profile-manager";

export function resolvePluginDataDir(pluginId: string): string {
    return path.resolve(ProfileManager.getPathInProfile("/script-data/"), `./${pluginId}/`);
}
