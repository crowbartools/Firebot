import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { AppConfig } from "config/app.config";
import { BaseDataStore } from "data-access/stores/base-store";
import {  Profile } from "firebot-types";
import path from "path";

type GlobalSettings = {
    activeProfileId: string
    profiles: Profile[],
}

@Injectable()
export class GlobalSettingsStore extends BaseDataStore<GlobalSettings> {
  constructor(
    @Inject(AppConfig.KEY)
    private appConfig: ConfigType<typeof AppConfig>
  ) {
    const filePath = path.join(appConfig.firebotDataPath, "global-settings");
    super(filePath, {
      activeProfileId: "Default Profile",
      profiles: [
        {
          id: "Default Profile",
          name: "Default Profile",
        },
      ],
    });
  }
}