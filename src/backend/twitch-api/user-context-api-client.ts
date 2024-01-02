import { ApiClient, ApiConfig } from "@twurple/api";

/**
 * A Twurple API client that always acts in the context of the specified user.
 *
 * Functionally equivalent to Twurple's internal `UserContextApiClient` class
 * used in the callback for `ApiClient.asUser`
 */
export class UserContextApiClient extends ApiClient {
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