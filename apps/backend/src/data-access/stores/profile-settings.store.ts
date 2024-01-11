import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { ProfileService } from "data-access/profile.service";
import { BaseProfileStore } from "data-access/stores/base-profile-store";

interface ProfileSettings {
  isFirstOpen: boolean;
}

@Injectable()
export class ProfileSettingsStore extends BaseProfileStore<ProfileSettings> {
  constructor(profileService: ProfileService, moduleRef: ModuleRef) {
    super(
      "settings",
      {
        isFirstOpen: true,
      },
      profileService,
      moduleRef
    );
  }
}