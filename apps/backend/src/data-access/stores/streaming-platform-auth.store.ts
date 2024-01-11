import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { ProfileService } from "data-access/profile.service";
import { BaseProfileStore } from "data-access/stores/base-profile-store";

interface StreamingPlatformStore {
  [platformId: string]: {
    activeAccountConfigIndex: number;
    accountConfigs: Array<{
      streamer: unknown;
      bot: unknown;
    }>;
  };
}

@Injectable()
export class StreamingPlatformAuthStore extends BaseProfileStore<StreamingPlatformStore> {
  constructor(profileService: ProfileService, moduleRef: ModuleRef) {
    super(
      "auth",
      {},
      profileService,
      moduleRef
    );
  }
}