type BaseAuthProviderConfig = {
  id: string;
  name: string;

  scopes: string[];
  clientId: string;
  /**
   * @default "localhost"
   */
  redirectUriHost?: string;
};

type DeviceAuthProvider = {
    type: "device";
    deviceAuthorizationEndpoint: string;
    tokenEndpoint: string;
}

type CodeAuthProvider = {
    type: "code";
    clientSecret: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
}

export type AuthProviderConfig =
  BaseAuthProviderConfig & (CodeAuthProvider
  | DeviceAuthProvider);

export type StreamingPlatformAuthConfig = Omit<
  BaseAuthProviderConfig,
  "scopes" | "id" | "name"
> & {
  streamerScopes: string[];
  botScopes: string[];
} & (DeviceAuthProvider | CodeAuthProvider);


