import path from "path";
import { ProfileManager } from "../../../common/profile-manager";

export function resolveScriptDataDir(scriptId: string): string {
    return path.resolve(ProfileManager.getPathInProfile("/script-data/"), `./${scriptId}/`);
}
