import { ApiClient } from "@twurple/api";
import { ListenerSignature, TypedEmitter } from "tiny-typed-emitter";

export abstract class ApiResourceBase<T extends ListenerSignature<T> = unknown> extends TypedEmitter<T> {
    protected _streamerClient: ApiClient;
    protected _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        super();

        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    updateApiClients(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }
}