/// <reference types="node" />

// Public contract types for the Firebot Plugin API.
// Everything a plugin can touch via `require("@crowbartools/firebot-types")`
// should be defined here

import type { EventFilter, TriggeredEvent } from "./events";
import type { RunEffectsContext } from "./effects";
import type { TwitchApi } from "../backend/streaming-platforms/twitch/api";
import type { Notification } from "./notifications";
import type { FirebotAccount } from "./accounts";
import type { FirebotSettingsTypes } from "./settings";
import type { InstalledPlugin } from "./plugins";
import type { PluginWebhook } from "./webhooks";
import type { ReplaceVariable, VariableConfig } from "./variables";
import type { FilterConfig, PresetFilterConfig, TextFilterConfig } from "../backend/events/filters/filter-factory";
import type { FirebotViewer } from "./viewers";
import type { Currency } from "./currency";
import type { OverlayWidgetConfig } from "./overlay-widgets";

export interface Accounts {
    /** Streamer account information */
    streamer: FirebotAccount;

    /** Bot account information. May be null if user has not logged in with a bot account. */
    bot: FirebotAccount;
}

export type PluginLogMethod = (message: string, ...meta: unknown[]) => void;

export interface PluginLoggerApi {
    /** Log a message at the debug log level. These may not appear in log files if the user has not enabled debug logging. */
    debug: PluginLogMethod;

    /** Log a message at the info log level */
    info: PluginLogMethod;

    /** Log a message at the warn log level */
    warn: PluginLogMethod;

    /** Log a message at the error log level */
    error: PluginLogMethod;
}

export interface PluginSettingsApi {
    /**
     * Get a Firebot setting value or its default
     *
     * @param settingName Name of the setting to get
     * @returns Setting value, or the default if one isn't explicitly set
     */
    getSetting<SettingName extends keyof FirebotSettingsTypes>(settingName: SettingName): FirebotSettingsTypes[SettingName];
}

export interface PluginStorageApi {
    /** Absolute path to this plugin's data directory. */
    readonly path: string;

    /**
     * Save a value as JSON under the given key. The key becomes the filename with a `.json` extension.
     * @param key The name of the key to store
     * @param value The value to store
     */
    setJson(key: string, value: unknown): Promise<void>;

    /**
     * Load a JSON value previously saved with {@linkcode setJson}
     * @param key The name of the key to get
     * @returns A `Promise` with either the data of type `T` or `null` if nothing has been stored under this key
    */
    getJson<T = unknown>(key: string): Promise<T | null>;

    /**
     * Delete the JSON value stored under the given key. No-op if missing.
     * @param key The name of the key to delete
     */
    deleteJson(key: string): Promise<void>;

    /**
     * Check whether a file exists in the data directory.
     * @param name Name of the file to check
     * @returns A `Promise<boolean>` indicating if the file exists
     */
    fileExists(name: string): Promise<boolean>;

    /**
     * Read a file's raw bytes
     * @param name Name of the file to read
     * @returns A `Promise` with either a `Buffer` containing the file's contents, or `null` if the file doesn't exist
     */
    readFile(name: string): Promise<Buffer | null>;

    /**
     * Read a file as text
     * @param name Name of the file to read
     * @param encoding Encoding to use when reading the file
     * @returns A `Promise` with either a `string` containing the file's contents, or `null` if the file doesn't exist
     */
    readTextFile(name: string, encoding?: BufferEncoding): Promise<string | null>;

    /**
     * Write contents to a file, creating any missing parent directories
     * @param name Name of the file to write
     * @param contents Data to store in the file
     */
    writeFile(name: string, contents: string | Buffer | Uint8Array): Promise<void>;

    /**
     * Delete a file. No-op if it doesn't exist.
     * @param name Name of the file to delete
     */
    deleteFile(name: string): Promise<void>;
}

export type PluginEventHandler = (event: TriggeredEvent) => void;

export interface PluginEventsApi {
    /**
     * Subscribe to all Firebot events as they trigger
     * @param hander Function to execute when an event is triggered
     * @returns An `unsubscribe` function
     */
    onTriggered(handler: PluginEventHandler): () => void;

    /**
     * Manually trigger a Firebot event
     * @param sourceId Event source ID
     * @param eventId Event ID
     * @param meta (Optional) Any metadata to include with the event
     */
    trigger(
        sourceId: string,
        eventId: string,
        meta?: Record<string, unknown>
    ): Promise<void>;
}

export interface PluginEffectsApi {
    /**
     * Run an effect list. Respects the list's run mode and effect queue, if any.
     * Resolves once the effects have been run (queued lists resolve
     * immediately).
     * @param context An object containing the context of the effects to run,
     * including any trigger data and effect outputs.
     */
    processEffects(context: RunEffectsContext): Promise<unknown>;
}

export interface PluginViewersApi {
    /**
     * Retrieve a Firebot user from the viewer database via their Twitch user ID
     * @param userId The viewer's Twitch user ID
     * @returns A {@linkcode FirebotViewer} with the specified user ID, or `undefined` if the viewer isn't in the database or the viewer database is disabled
     */
    getViewerByUserId(userId: string): Promise<FirebotViewer>;

    /**
     * Retrieve a Firebot user from the viewer database via their Twitch username
     * @param username The viewer's Twitch username
     * @returns A {@linkcode FirebotViewer} with the specified username, or `undefined` if the viewer isn't in the database or the viewer database is disabled
     */
    getViewerByUsername(username: string): Promise<FirebotViewer>;

    /**
     * Get a metadata value for a given user
     * @param userId The viewer's Twitch user ID
     * @param key Key of the metadata value to get
     * @param propertyPath (Optional) Dot-notated property path
     * @returns A `Promise` with the value, or `null` if it doesn't exist
     */
    getViewerMetadataValue(userId: string, key: string, propertyPath: string): Promise<unknown>;

    /**
     * Set a metadata value for a given user
     * @param userId The viewer's Twitch user ID
     * @param key Key of the metadata value to set
     * @param value Data to store
     * @param propertyPath (Optional) Dot-notated property path
     */
    setViewerMetadataValue(userId: string, key: string, value: string, propertyPath: string): Promise<void>;

    /**
     * Delete a metadata value for a given user
     * @param userId The viewer's Twitch user ID
     * @param key Key of the metadata value to delete
     */
    deleteViewerMetadataValue(userId: string, key: string): Promise<void>;
}

export interface PluginCurrencyApi {
    /**
     * Get an array of all currencies
     * @returns An array of {@linkcode Currency}
     */
    getAllCurrencies(): Array<Currency>;

    /**
     * Get a specific currency by its ID
     * @param id ID of the currency to get
     * @returns The {@linkcode Currency} with the given ID, or `null` if it doesn't exist
     */
    getCurrencyById(id: string): Currency;

    /**
     * Get a specific currency by its name
     * @param name Name of the currency to get
     * @returns The {@linkcode Currency} with the given name, or `null` if it doesn't exist
     */
    getCurrencyByName(name: string): Currency;

    /**
     * Get the amount of a viewer's currency
     * @param userId The viewer's Twitch user ID
     * @param currencyId The ID of the currency to get
     * @returns A `Promise` with the total of the specified currency the viewer currently has
     */
    getViewerCurrency(userId: string, currencyId: string): Promise<number>;

    /**
     * Add to or subtract from a viewer's currency
     * @param userId The viewer's Twitch user ID
     * @param currencyId The ID of the currency to adjust
     * @param amount An amount to add to the specified currency for the viewer. Negative values will subtract that amount.
     * @returns A `Promise` indicating if the adjustment to the viewer's currency was successful
     */
    addOrSubtractViewerCurrency(userId: string, currencyId: string, amount: number): Promise<boolean>;

    /**
     * Set a viewer's currency to a specific amount
     * @param userId The viewer's Twitch user ID
     * @param currencyId The ID of the currency to set
     * @param amount The total amount of the specified currency the viewer should have
     * @returns A `Promise` indicating if setting the viewer's currency was successful
     */
    setViewerCurrency(userId: string, currencyId: string, amount: number): Promise<boolean>;

    /**
     * Get an array of viewers with the highest amounts of a specific currency
     * @param currencyId The ID of the currency
     * @param count The total number of viewers to retrieve
     * @returns A `Promise` with an array of {@linkcode FirebotViewer} representing the
     * viewers that possess the specified currency, sorted by highest amount first
     */
    getCurrencyLeaderboard(currencyId: string, count: number): Promise<Array<FirebotViewer>>;
}

export interface PluginTwitchApi {
    /** The full Twitch API surface. See {@linkcode TwitchApi}. */
    api: typeof TwitchApi;
}

export interface PluginParametersApi {
    /**
     * Get all parameter values for this plugin
     * @returns A `Record<string, unknown>` containing the parameter names and their values
     */
    getAll<T extends Record<string, unknown> = Record<string, unknown>>(): T;
}

export interface PluginFrontendCommunicatorApi {
    /**
     * Send a synchronous event to the frontend
     * @param eventName Name of the event to send
     * @param (Optional) Any data to send with the event
     */
    send<ExpectedArg = unknown>(eventName: string, data?: ExpectedArg): void;

    /**
     * Send an asynchronous event to the frontend and await the reply it sends
     * back
     * @param eventName Name of the event to send
     * @param (Optional) Any data to send with the event
     * @returns A `Promise` with any response data received
     */
    fireEventAsync<ReturnPayload = void, ExpectedArg = unknown>(
        eventName: string,
        data?: ExpectedArg
    ): Promise<ReturnPayload>;
}

export interface PluginOverlayWidgetsApi {
    /**
     * Get all overlay widget configs of a specified type
     * @param typeId ID of the overlay widget type
     * @returns An array of {@linkcode OverlayWidgetConfig} matching the given type
     */
    getConfigsOfType<Config extends OverlayWidgetConfig = OverlayWidgetConfig>(typeId: string): Config[];

    /**
     * Get the current state data of an overlay widget
     * @param widgetId ID of the overlay widget to get
     * @returns A `Record<string, unknown>` containing the overlay widget's current state
     */
    getWidgetState<State = Record<string, unknown>>(widgetId: string): State | null;

    /**
     * Set the state data of an overlay widget
     * @param widgetId ID of the overlay widget to update
     * @param state The new state data for the overlay widget
     * @param persist (Optional) `true` to persist the new overlay widget state across
     * Firebot sessions, or `false` to discard it when Firebot exits. Default is `true`.
     */
    setWidgetState<State extends Record<string, unknown>>(widgetId: string, state: State, persist: boolean): void;
}

export interface PluginOverlayApi {
    /** Access to overlay widget configurations and state data */
    widgets: PluginOverlayWidgetsApi;
}

export interface PluginMessageEvent<TPayload = unknown> {
    /** The pluginId of the plugin that sent the message */
    sender: string;

    /** The provided payload */
    payload: TPayload;
}

export interface ScopedIpc {
    /**
     * Broadcast a message on a channel
     * @param channel Name of the channel to send on
     * @param data Data to send with the message
     */
    emit(channel: string, data: unknown): void;

    /**
     * Listen for messages on a channel
     * @param channel Name of the channel to listen on
     * @param callback A function that will get executed when a message is received
     * @returns An `unsubscribe` function
     */
    on<TPayload = unknown>(
        channel: string,
        callback: (event: PluginMessageEvent<TPayload>) => void
    ): () => void;

    /**
     * Remove a previously registered {@linkcode on} listener
     * @param channel Name of the channel to stop listening on
     * @param callback The function that was used during registration
     */
    off(channel: string, callback: (...args: never[]) => void): void;

    /**
     * Send a request on a channel and await a response. Rejects if
     * no handler responds within a 10s timeout or if the handler throws.
     * @param channel Name of the channel to invoke on
     * @param data (Optional) Any data to send along with the request
     * @returns A `Promise` with any response data received
     */
    invoke<TRequestPayload = unknown, TResponseData = unknown>(
        channel: string,
        data?: TRequestPayload
    ): Promise<TResponseData>;

    /**
     * Register the handler for a request channel
     * @param channel Name of the channel to listen on
     * @param handlerFn A function that is executed when a request
     * is invoked on the specified channel using {@linkcode invoke}
     */
    handle<TRequestPayload = unknown, TResponseData = unknown>(
        channel: string,
        handlerFn: (payload: TRequestPayload, sender: string) => Promise<TResponseData> | TResponseData
    ): void;
}

export interface PluginNotificationsApi {
    /**
     * Create a new notification
     * @param notification The notification to add
     * @param permanentlySave (Optional) Set as `true` to persist the notification across Firebot restarts
     * @returns The {@linkcode Notification} that was created
     */
    add(notification: Pick<Notification, "title" | "message" | "type" | "metadata">, permanentlySave?: boolean): Notification;

    /**
     * Look up one of this plugin's notifications by ID
     * @param id ID of the notification to retrieve
     * @returns The {@linkcode Notification} with the given ID, or `null` if it doesn't exist
     */
    get(id: string): Notification | null;

    /**
     * All notifications owned by this plugin
     * @returns An array of {@linkcode Notification}
     */
    getAll(): Array<Notification>;

    /**
     * Delete one of this plugin's notifications by ID
     * @param id ID of the notification to delete
     */
    delete(id: string): void;

    /** Delete all of this plugin's notifications */
    clearAll(): void;
}

export interface PluginPluginsApi {
    /**
     * Get a list of plugins currently installed by the user
     * @returns A `Promise` with an array of {@linkcode InstalledPlugin} objects
     */
    getInstalledPlugins(): Promise<Array<InstalledPlugin>>;
}

export interface PluginWebServerApi {
    /**
     * Send a custom event over the internal Firebot WebSocket server
     * @param name Name of the event to send. Full event name will be `custom-event:{name}`
     * @param data (Optional) Any data you would like to send with the event
     */
    sendWebSocketEvent(name: string, data?: unknown): void;

    /**
     * Create a resource token for a file to be retrieved via the internal HTTP server (e.g. in an overlay).
     * The URL format for retrieval is: `http://localhost:7472/resource/{token}`
     * @param path Full file path of the resource
     * @param ttl (Optional) Time (in seconds) to retain the resource token once it is retrieved the first time.
     * Setting this to `null`/`undefined` will retain the token until Firebot exits.
     * @returns A token representing the resource
     */
    createResourceToken(path: string, ttl?: number): string;
}

export interface PluginWebhooksApi {
    /**
     * Look up a webhook by name
     * @param name Name of the webhook
     * @return The {@linkcode PluginWebhook} with the given name, or `null` if it doesn't exist
     */
    get(name: string): PluginWebhook | null;

    /**
     * Get all webhooks owned by this plugin
     * @returns An array of {@linkcode PluginWebhook}
     */
    list(): Array<PluginWebhook>;

    /**
     * Get the public URL for a webhook by name
     * @param name Name of the webhook
     * @returns The webhook's URL, or `null` if it doesn't exist
     */
    getUrl(name: string): string | null;
}

export interface PluginVariableFactoryApi {
    /**
     * Create a basic replace variable based on an event metadata value
     * @param config Configuration data for the new variable
     * @returns A {@linkcode ReplaceVariable} based on the specified config data
     */
    createEventDataVariable(config: VariableConfig): ReplaceVariable;
}

export interface PluginEventFilterFactoryApi {
    /**
     * Create a basic event filter based on a text value
     * @param config Configuration data for the new filter
     * @returns An {@linkcode EventFilter} based on the specified config data
     */
    createTextFilter(config: TextFilterConfig): EventFilter;

    /**
     * Create a basic event filter based on a numeric value
     * @param config Configuration data for the new filter
     * @returns An {@linkcode EventFilter} based on the specified config data
     */
    createNumberFilter(config: FilterConfig): EventFilter;

    /**
     * Create a basic event filter based on either a text or numeric value
     * @param config Configuration data for the new filter
     * @returns An {@linkcode EventFilter} based on the specified config data
     */
    createTextOrNumberFilter(config: TextFilterConfig): EventFilter;

    /**
     * Create a basic event filter based on a list of preset values
     * @param config Configuration data for the new filter
     * @returns An {@linkcode EventFilter} based on the specified config data
     */
    createPresetFilter(config: PresetFilterConfig): EventFilter;
}

export interface PluginFactoriesApi {
    /**
     * Factory functions for creating basic replace variables
     */
    variables: PluginVariableFactoryApi;

    /**
     * Factory functions for creating basic event filters
     */
    eventFilters: PluginEventFilterFactoryApi;
}

export interface FirebotPluginApi {
    /** Running Firebot version, e.g. `"5.67.0"` */
    version: string;

    /** The user's streamer and bot accounts currently in use */
    accounts: Accounts;

    /** A scoped logger */
    logger: PluginLoggerApi;

    /** Access to Firebot settings */
    settings: PluginSettingsApi;

    /**
     * Simple per-plugin storage scoped to the plugin's data directory.
     * Provides helpers for storing/loading JSON values
     * plus generic file read/write for anything else.
     */
    storage: PluginStorageApi;

    /** Subscribe to and trigger Firebot events */
    events: PluginEventsApi;

    /** Run effect lists */
    effects: PluginEffectsApi;

    /** Access to the viewer database, including viewer metadata */
    viewers: PluginViewersApi;

    /** Access to currencies, including viewer currency amounts and leaderboards */
    currency: PluginCurrencyApi;

    /** Access to Firebot's Twitch API wrappers (Helix, chat, auth, etc) */
    twitch: PluginTwitchApi;

    /**
     * Access to this plugin's saved parameter values (the settings configured by
     * the user)
     */
    parameters: PluginParametersApi;

    /**
     * Two-way messaging between the plugin and the Firebot frontend, including
     * UI Extensions
     */
    frontendCommunicator: PluginFrontendCommunicatorApi;

    /** Access to overlays, including overlay widgets */
    overlay: PluginOverlayApi;

    /**
     * Plugin-to-plugin messaging. Supports both fire-and-forget (`emit`/`on`/`off`)
     * and request/response (`invoke`/`handle`) messaging over a shared event bus,
     * based on Electron's IPC.
     */
    messaging: ScopedIpc;

    /** In-app user notifications owned by this plugin */
    notifications: PluginNotificationsApi;

    /** Access to installed plugins */
    plugins: PluginPluginsApi;

    /** Firebot internal web server functions */
    webServer: PluginWebServerApi;

    /** Webhooks owned by this plugin */
    webhooks: PluginWebhooksApi;

    /** Factory functions for creating basic Firebot objects (variables, event filters, etc.) */
    factories: PluginFactoriesApi;
}
