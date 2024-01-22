import { Get } from "@nestjs/common";
import { ProfileService } from "data-access/profile.service";
import { Profile } from "firebot-types";
import { FirebotController } from "misc/firebot-controller.decorator";

@FirebotController({
  path: "profile",
})
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfiles(): Promise<Profile[]> {
    return this.profileService.getProfiles();
  }

  @Get("active")
  async getActiveProfile(): Promise<Profile> {
    return this.profileService.getActiveProfile();
  }
}