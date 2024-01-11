import { BaseDataStore } from "data-access/stores/base-store";
import { ModuleRef } from "@nestjs/core";
import { ConfigType } from "@nestjs/config";
import { ProfileService } from "data-access/profile.service";
import path from "path";
import { AppConfig } from "config/app.config";

export class BaseProfileStore<Settings> extends BaseDataStore<Settings> {
    constructor(
        filePath: string,
        defaultSettings: Settings,
        profileService: ProfileService,
        moduleRef: ModuleRef
    ) {
        const appConfig = moduleRef.get<ConfigType<typeof AppConfig>>(AppConfig.KEY, { strict: false});

        const firebotDataPath = appConfig.firebotDataPath;

        const getPathInProfile = (
          profileName: string,
          profileFilePath: string
        ) =>
          path.join(firebotDataPath, "profiles", profileName, profileFilePath);

        profileService.on("activeProfileChanged", (profile) => {
            this.load(getPathInProfile(profile.name, filePath));
        });
        
        super(
          getPathInProfile(
            profileService.getActiveProfile()?.name ?? "",
            filePath
          ),
          defaultSettings
        );
    }
}