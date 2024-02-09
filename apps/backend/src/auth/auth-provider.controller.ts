import { BadRequestException, Post, Query } from "@nestjs/common";
import { AuthProviderManager } from "auth/auth-provider-manager.service";
import { FirebotController } from "../misc/firebot-controller.decorator";
import type { FirebotAccountType } from "firebot-types";

@FirebotController({
  path: "auth-provider",
})
export class AuthProviderController {
  constructor(
    private readonly authProviderManager: AuthProviderManager,
  ) {}

  @Post("/device-flow")
  async startDeviceFlow(
    @Query("streamingPlatformId") streamingPlatformId: string,
    @Query("accountType") accountType: FirebotAccountType,
    @Query("loginConfigId") loginConfigId: string
    ) {
    const providerId = `${streamingPlatformId}-${accountType}`;
    const provider = this.authProviderManager.getProvider(providerId);
    if (!provider) {
      throw new BadRequestException(
        `Provider with ID ${providerId} does not exist.`
      );
    }
    if (provider.config.type !== "device") {
      throw new BadRequestException(
        `Provider with ID ${providerId} is not a device flow provider.`
      );
    }

    return this.authProviderManager.startDeviceFlow(providerId, {
      streamingPlatformId,
      accountType,
      loginConfigId,
    });
  }
}