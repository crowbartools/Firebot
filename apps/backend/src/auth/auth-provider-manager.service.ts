import { Injectable } from "@nestjs/common";
import { TypedEmitter } from "tiny-typed-emitter";
import { AuthProviderConfig, AuthTokenSet, type FirebotAccountType } from "firebot-types";
import { BaseClient, DeviceFlowHandle, Issuer } from "openid-client";
import { RealTimeGateway } from "../real-time/real-time.gateway";

interface AuthProvider {
  config: AuthProviderConfig;
  issuer: Issuer;
  client: BaseClient;
  authorizationUrl?: string;
}

export interface AuthMetadata {
  streamingPlatformId: string;
  accountType: FirebotAccountType;
  loginConfigId: string;
}

@Injectable()
export class AuthProviderManager extends TypedEmitter<{
  "successful-auth": (
    provider: AuthProvider,
    tokenSet: AuthTokenSet,
    metadata: AuthMetadata
  ) => void;
}> {
  private readonly providers: AuthProvider[] = [];

  private currentDeviceFlowHandle: DeviceFlowHandle<BaseClient> | null = null;

  constructor(private readonly realTimeGateway: RealTimeGateway) {
    super();
  }

  registerProvider(providerConfig: AuthProviderConfig) {
    if (this.providers.some((p) => p.config.id === providerConfig.id)) {
      throw new Error(`Provider with ID ${providerConfig.id} already exists.`);
    }

    let issuer: Issuer;
    let client: BaseClient;
    let authorizationUrl: string | undefined = undefined;
    if (providerConfig.type === "device") {
      issuer = new Issuer({
        issuer: providerConfig.name,
        device_authorization_endpoint:
          providerConfig.deviceAuthorizationEndpoint,
        token_endpoint: providerConfig.tokenEndpoint,
      });
      client = new issuer.Client({
        client_id: providerConfig.clientId,
        token_endpoint_auth_method: "none",
        redirect_uris: [
          `http://${
            providerConfig.redirectUriHost ?? "localhost"
          }:3000/auth/callback`,
        ],
      });
    } else if (providerConfig.type === "code") {
      issuer = new Issuer({
        issuer: providerConfig.name,
        authorization_endpoint: providerConfig.authorizationEndpoint,
        token_endpoint: providerConfig.tokenEndpoint,
      });
      client = new issuer.Client({
        client_id: providerConfig.clientId,
        redirect_uris: [
          `http://${
            providerConfig.redirectUriHost ?? "localhost"
          }:3000/auth/callback`,
        ],
        response_types: ["code"],
      });
      authorizationUrl = client.authorizationUrl({
        scope: providerConfig.scopes.join(" "),
        state: providerConfig.id,
      });
    } else {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Unknown auth provider type: ${(providerConfig as any).type}`
      );
    }

    this.providers.push({
      config: providerConfig,
      issuer,
      client,
      authorizationUrl,
    });
  }

  getProvider(id: string) {
    return this.providers.find((p) => p.config.id === id);
  }

  async startDeviceFlow(providerId: string, metadata: AuthMetadata) {
    const provider = this.getProvider(providerId);
    if (!provider || provider.config.type !== "device") {
      return null;
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
        const firebotTokenSet: AuthTokenSet = {
          accessToken: tokenSet.access_token,
          tokenType: tokenSet.token_type,
          refreshToken: tokenSet.refresh_token,
          scope: tokenSet.scope,
          expiresAt: tokenSet.expires_at,
          expiresIn: tokenSet.expires_in,
        };
        this.emit("successful-auth", provider, firebotTokenSet, metadata);
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

    console.log("device auth", handle);

    return {
      code: handle.device_code,
      verificationUri: handle.verification_uri_complete,
    };
  }
}