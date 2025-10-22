import { ApiClient } from "@twurple/api";
import { ListenerSignature, TypedEmitter } from "tiny-typed-emitter";
import { TwitchApiBase } from "../api";

export abstract class ApiResourceBase<T extends ListenerSignature<T> = unknown> extends TypedEmitter<T> {
    private _apiBase: TwitchApiBase;

    constructor(apiBase: TwitchApiBase) {
        super();

        this._apiBase = apiBase;
    }

    protected get streamerClient(): ApiClient {
        return this._apiBase.streamerClient;
    }

    protected get botClient(): ApiClient {
        return this._apiBase.botClient;
    }

    protected get logger() {
        return this._apiBase.logger;
    }

    protected get accounts() {
        return this._apiBase.accounts;
    }
}