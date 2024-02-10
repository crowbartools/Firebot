import { ApiClient, ApiConfig } from "@twurple/api";
import { AuthProvider } from "@twurple/auth";
import { Id } from "firebot-types/src/streaming-platform/helpers";

type ClientConfig = { userId: Id; authProvider: AuthProvider };

class TwitchApiClient {
  private _streamerClient: ApiClient | null = null;
  private _botClient: UserContextApiClient | null = null;

  setupApiClients(
    streamerConfig?: ClientConfig,
    botConfig?: ClientConfig
  ): void {
    if (!streamerConfig && !botConfig) {
      return;
    }

    if (streamerConfig) {
      this._streamerClient = new ApiClient({
        authProvider: streamerConfig.authProvider,
      });
    } else {
      this._streamerClient = null;
    }

    if (botConfig) {
      this._botClient = new UserContextApiClient(
        { authProvider: botConfig.authProvider },
        botConfig.userId as string
      );
    }
  }

  get streamerClient(): ApiClient | null {
    return this._streamerClient;
  }

  get botClient(): ApiClient | null {
    return this._botClient;
  }
}

export const twitchApiClient = new TwitchApiClient();

/**
 * A Twurple API client that always acts in the context of the specified user.
 *
 * Functionally equivalent to Twurple's internal `UserContextApiClient` class
 * used in the callback for `ApiClient.asUser`
 */
class UserContextApiClient extends ApiClient {
    constructor(
        config: ApiConfig,
        private readonly _userId: string
    ) {
        super(config);
    }

    _getUserIdFromRequestContext(): string {
        return this._userId;
    }
}