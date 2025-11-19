import { ApiClient } from "@twurple/api";
import { ListenerSignature, TypedEmitter } from "tiny-typed-emitter";
import type { TwitchApi } from "../";

export abstract class ApiResourceBase<T extends ListenerSignature<T> = unknown> extends TypedEmitter<T> {
    private _apiBase: typeof TwitchApi;

    constructor(apiBase: typeof TwitchApi) {
        super();

        this._apiBase = apiBase;
    }

    protected get streamerClient(): ApiClient {
        return this._apiBase.streamerClient;
    }

    protected get botClient(): ApiClient {
        return this._apiBase.botClient;
    }

    protected get moderationClient(): ApiClient {
        return this._apiBase.moderationClient;
    }

    protected get logger() {
        return this._apiBase.logger;
    }

    protected get accounts() {
        return this._apiBase.accounts;
    }

    protected get usersApi() {
        return this._apiBase.users;
    }
}