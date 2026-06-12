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

export type PluginLogMethod = (message: string, ...meta: unknown[]) => void;

export interface PluginLoggerApi {
    debug: PluginLogMethod;
    info: PluginLogMethod;
    warn: PluginLogMethod;
    error: PluginLogMethod;
}

export interface PluginWebhooksApi {
    /** Look up a webhook by name. */
    get(name: string): PluginWebhook | null;
    /** All webhooks owned by this plugin. */
    list(): PluginWebhook[];
    /** Public URL for a webhook by name, or null if not found. */
    getUrl(name: string): string | null;
}

/**
 * Simple per-plugin storage scoped to the plugin's data directory.
 * Provides helpers for storing/loading JSON values
 * plus generic file read/write for anything else.
 */
export interface PluginStorageApi {
    /** Absolute path to this plugin's data directory. */
    readonly path: string;

    /** Save a value as JSON under the given key. The key becomes the filename with a `.json` extension. */
    setJson(key: string, value: unknown): Promise<void>;
    /**
     * Load a JSON value previously saved with `setJson`. Returns `null` if
     * nothing has been stored under this key.
     */
    getJson<T = unknown>(key: string): Promise<T | null>;
    /** Delete the JSON value stored under the given key. No-op if missing. */
    deleteJson(key: string): Promise<void>;

    /** Check whether a file exists in the data directory. */
    fileExists(name: string): Promise<boolean>;
    /** Read a file's raw bytes. Returns `null` if it doesn't exist. */
    readFile(name: string): Promise<Buffer | null>;
    /** Read a file as text. Returns `null` if it doesn't exist. */
    readTextFile(name: string, encoding?: BufferEncoding): Promise<string | null>;
    /** Write contents to a file, creating any missing parent directories. */
    writeFile(name: string, contents: string | Buffer | Uint8Array): Promise<void>;
    /** Delete a file. No-op if it doesn't exist. */
    deleteFile(name: string): Promise<void>;
}

export type PluginEventHandler = (event: TriggeredEvent) => void;

export interface PluginEventsApi {
    /**
     * Subscribe to all Firebot events as they trigger. Returns an `unsubscribe`
     * function.
     */
    onTriggered(handler: PluginEventHandler): () => void;

    /**
     * Manually trigger a Firebot event.
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
     */
    processEffects(context: RunEffectsContext): Promise<unknown>;
}

export interface PluginTwitchApi {
    /** The full Twitch API surface. See {@linkcode TwitchApi}. */
    api: typeof TwitchApi;
}

/**
 * Access to this plugin's saved parameter values (the settings configured by
 * the user)
 */
export interface PluginParametersApi {
    getAll<T extends Record<string, unknown> = Record<string, unknown>>(): T;
}

export interface PluginNotificationsApi {
    /**
     * Create a new notification. Pass `permanentlySave` as `true` to persist it
     * across restarts.
     */
    add(notification: Pick<Notification, "title" | "message" | "type" | "metadata">, permanentlySave?: boolean): Notification;
    /** Look up one of this plugin's notifications by id. */
    get(id: string): Notification | null;
    /** All notifications owned by this plugin. */
    getAll(): Notification[];
    /** Delete one of this plugin's notifications by id. */
    delete(id: string): void;
    /** Delete all of this plugin's notifications. */
    clearAll(): void;
}

export interface PluginFrontendCommunicatorApi {
    /** Send a synchronous event to the frontend. */
    send<ExpectedArg = unknown>(eventName: string, data?: ExpectedArg): void;

    /**
     * Send an asynchronous event to the frontend and await the reply it sends
     * back.
     */
    fireEventAsync<ReturnPayload = void, ExpectedArg = unknown>(
        eventName: string,
        data?: ExpectedArg
    ): Promise<ReturnPayload>;

    /**
     * Handle a synchronous event triggered by the frontend. Returns an
     * `unsubscribe` function.
     */
    on<ExpectedArgs extends Array<unknown> = [], ReturnPayload = void>(
        eventName: string,
        callback: (...args: ExpectedArgs) => ReturnPayload
    ): () => void;

    /**
     * Handle an asynchronous event triggered by the frontend. Returns an
     * `unsubscribe` function.
     */
    onAsync<ExpectedArgs extends Array<unknown> = [], ReturnPayload = void>(
        eventName: string,
        callback: (...args: ExpectedArgs) => Promise<ReturnPayload>
    ): () => void;
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

export interface PluginPluginsApi {
    /**
     * Get a list of currently installed plugins installed by the user
     */
    getInstalledPlugins(): Promise<Array<InstalledPlugin>>;
}

export interface Accounts {
    streamer: FirebotAccount;
    bot: FirebotAccount;
}

export interface PluginWebServerApi {
    /**
     * Sends a custom event over the internal Firebot WebSocket server
     * @param name Name of the event to send. Full event name will be `custom-event:{name}`
     * @param data Any optional data you would like to send with the event
     */
    sendWebSocketEvent(name: string, data?: unknown);
}

export interface PluginVariableFactoryApi {
    createEventDataVariable(config: VariableConfig): ReplaceVariable;
}

export interface PluginEventFilterFactoryApi {
    createTextFilter(config: TextFilterConfig): EventFilter;
    createNumberFilter(config: FilterConfig): EventFilter;
    createTextOrNumberFilter(config: TextFilterConfig): EventFilter;
    createPresetFilter(config: PresetFilterConfig): EventFilter;
}

export interface FirebotPluginApi {
    /** Running Firebot version, e.g. `"5.67.0"`. */
    version: string;
    /** The streamer and bot accounts currently in use. */
    accounts: Accounts;
    /** Scoped logger. */
    logger: PluginLoggerApi;
    /** Access to Firebot settings. */
    settings: PluginSettingsApi;
    /** Webhooks owned by this plugin. */
    webhooks: PluginWebhooksApi;
    /** Simple persistent storage rooted at this plugin's data directory. */
    storage: PluginStorageApi;
    /** Subscribe to and trigger Firebot events + register event sources. */
    events: PluginEventsApi;
    /** Run effect lists. */
    effects: PluginEffectsApi;
    /** Access to Firebot's Twitch API wrappers (Helix, chat, auth, etc). */
    twitch: PluginTwitchApi;
    /** This plugin's saved parameter values. */
    parameters: PluginParametersApi;
    /** Two-way messaging between the plugin and the frontend. */
    frontendCommunicator: PluginFrontendCommunicatorApi;
    /** Notifications owned by this plugin. */
    notifications: PluginNotificationsApi;
    /** Access to installed plugins. */
    plugins: PluginPluginsApi;
    /** Firebot internal web server functions. */
    webServer: PluginWebServerApi;
    /** Factory for creating variables based on event data. */
    variableFactory: PluginVariableFactoryApi;
    /** Factory for creating event filters. */
    eventFilterFactory: PluginEventFilterFactoryApi;
}
