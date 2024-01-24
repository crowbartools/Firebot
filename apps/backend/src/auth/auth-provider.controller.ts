import { BadRequestException } from "@nestjs/common";
import { AuthProviderManager } from "auth/auth-provider-manager.service";
import { FirebotController } from "../misc/firebot-controller.decorator";
import { BaseClient, DeviceFlowHandle } from "openid-client";
import { RealTimeGateway } from "../real-time/real-time.gateway";

@FirebotController({
  path: "auth-provider",
})
export class AuthProviderController {
  private currentDeviceFlowHandle: DeviceFlowHandle<BaseClient> | null = null;

  constructor(
    private readonly authProviderManager: AuthProviderManager,
    private readonly realTimeGateway: RealTimeGateway
  ) {}

  async startDeviceFlow(providerId: string) {
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

    if (this.currentDeviceFlowHandle) {
      this.currentDeviceFlowHandle.abort();
      this.currentDeviceFlowHandle = null;
    }

    const handle = await provider.client.deviceAuthorization({
      scope: provider.config.scopes.join(" "),
    });

    this.currentDeviceFlowHandle = handle;

    this.currentDeviceFlowHandle
      .poll()
      .then((tokenSet) => {
        console.log(tokenSet);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        this.currentDeviceFlowHandle = null;
        this.realTimeGateway.broadcast("device-flow-finished", {
            providerId,
        });
      });

    return {
      code: handle.device_code,
      verificationUri: handle.verification_uri_complete,
    };
  }
}