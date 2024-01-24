import { Injectable } from "@nestjs/common";
import { TypedEmitter } from "tiny-typed-emitter";
import { AuthProviderConfig } from "firebot-types";
import { BaseClient, Issuer } from "openid-client";

interface AuthProvider {
  config: AuthProviderConfig;
  issuer: Issuer;
  client: BaseClient;
  authorizationUrl?: string;
}

@Injectable()
export class AuthProviderManager extends TypedEmitter {
  private readonly providers: AuthProvider[] = [];

  constructor() {
    super();
  }

  registerProvider(providerConfig: AuthProviderConfig) {
    if (this.providers.some((p) => p.config.id === providerConfig.id)) {
      throw new Error(`Provider with ID ${providerConfig.id} already exists.`);
    }

    let issuer: Issuer;
    let client: BaseClient;
    let authorizationUrl: string | undefined = undefined;
    if(providerConfig.type === "device") {
        issuer = new Issuer({
          issuer: providerConfig.name,
          device_authorization_endpoint:
            providerConfig.deviceAuthorizationEndpoint,
          token_endpoint: providerConfig.tokenEndpoint,
        });
        client = new issuer.Client({
            client_id: providerConfig.clientId,
            redirect_uris: [`http://${providerConfig.redirectUriHost ?? 'localhost'}:3000/auth/callback`],
        });
    } else if(providerConfig.type === "code") {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error(`Unknown auth provider type: ${(providerConfig as any).type}`);
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
}