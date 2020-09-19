import { FbConfig } from "./fb-config";
import profileManager from "../profile-manager";
import path from "path";
import { logger } from "../utils";

export class ProfileConfig<Settings> extends FbConfig<Settings> {
    constructor(profileFilePath: string, defaultData: Settings) {
        const getPathInProfile = (profileFilePath: string) =>
            path.join(
                "profiles",
                profileManager.activeProfile.name,
                profileFilePath
            );

        const pathInProfile = getPathInProfile(profileFilePath);

        logger.debug("Path in profile", pathInProfile);

        super(pathInProfile, defaultData);
        profileManager.on("activeProfileChanged", () => {
            this.load(getPathInProfile(profileFilePath));
        });
    }
}
