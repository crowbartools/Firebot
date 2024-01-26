import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { ProfileService } from "../profile.service";
import { BaseProfileStore } from "./base-profile-store";
import { StreamingPlatformLoginSettings } from "firebot-types";

@Injectable()
export class StreamingPlatformLoginsStore extends BaseProfileStore<StreamingPlatformLoginSettings> {
  constructor(profileService: ProfileService, moduleRef: ModuleRef) {
    super("logins", {}, profileService, moduleRef);
  }
}