import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { ProfileService } from "../profile.service";
import { BaseProfileStore } from "./base-profile-store";
import { CommandConfigsSettings } from "firebot-types";

@Injectable()
export class CommandConfigsStore extends BaseProfileStore<CommandConfigsSettings> {
  constructor(profileService: ProfileService, moduleRef: ModuleRef) {
    super(
      "commands",
      {
        commands: [],
      },
      profileService,
      moduleRef
    );
  }
}
