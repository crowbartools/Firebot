import { Get } from "@nestjs/common";
import { ProfileService } from "data-access/profile.service";
import { UserProfile } from "firebot-types";
import { FirebotController } from "misc/firebot-controller.decorator";

@FirebotController({
    path: "user-profile"
})
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get()
    async getProfiles(): Promise<UserProfile[]> {
        return this.profileService.getUserProfiles();
    }

    @Get("active")
    async getActiveProfile(): Promise<UserProfile> {
        return this.profileService.getActiveProfile();
    }
}