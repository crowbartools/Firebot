/// <reference types="node" />

// Public contract types for the Firebot Script API.
// Everything a custom script can touch via `require("@crowbartools/firebot-types")`
// should be defined here

import type { TriggeredEvent } from "./events";
import type { RunEffectsContext } from "./effects";
import type { TwitchApi } from "../backend/streaming-platforms/twitch/api";

export type ScriptLogMethod = (message: string, ...meta: unknown[]) => void;

export interface ScriptLoggerApi {
    debug: ScriptLogMethod;
    info: ScriptLogMethod;
    warn: ScriptLogMethod;
    error: ScriptLogMethod;
}

export interface ScriptWebhook {
    id: string;
    name: string;
}

export interface ScriptWebhookEvent {
    webhook: ScriptWebhook;
    payload: unknown;
    rawPayload?: string;
    headers: Record<string, string>;
}

export type ScriptWebhookEventHandler = (event: ScriptWebhookEvent) => void;

export interface ScriptWebhooksApi {
    /** Create a new webhook (or return the existing one with the same name). */
    save(name: string): ScriptWebhook | null;
    /** Look up a webhook by name. */
    get(name: string): ScriptWebhook | null;
    /** Delete a webhook by name. Returns true if one was removed. */
    delete(name: string): boolean;
    /** All webhooks owned by this script. */
    list(): ScriptWebhook[];
    /** Public URL for a webhook by name, or null if not found. */
    getUrl(name: string): string | null;
    /**
     * Subscribe to webhook events for this script. Returns an `unsubscribe` func
     */
    onReceived(handler: ScriptWebhookEventHandler): () => void;
}

/**
 * Simple per-script storage scoped to the script's data directory.
 * Provides helpers for storing/loading JSON values
 * plus generic file read/write for anything else.
 */
export interface ScriptStorageApi {
    /** Absolute path to this script's data directory. */
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

export type ScriptEventHandler = (event: TriggeredEvent) => void;

export interface ScriptEventsApi {
    /**
     * Subscribe to all Firebot events as they trigger. Returns an `unsubscribe`
     * function.
     */
    onTriggered(handler: ScriptEventHandler): () => void;

    /**
     * Manually trigger a Firebot event.
     */
    trigger(
        sourceId: string,
        eventId: string,
        meta?: Record<string, unknown>
    ): Promise<void>;
}

export interface ScriptEffectsApi {
    /**
     * Register an existing effect to be available for an event.
     * Useful for surfacing built-in effects on script provided events.
     */
    addEventToEffect(effectId: string, eventSourceId: string, eventId: string): void;

    /** Reverse of `addEventToEffect`. */
    removeEventFromEffect(effectId: string, eventSourceId: string, eventId: string): void;

    /**
     * Run an effect list. Respects the list's run mode and effect queue, if any.
     * Resolves once the effects have been run (queued lists resolve
     * immediately).
     */
    processEffects(context: RunEffectsContext): Promise<unknown>;
}

export interface ScriptTwitchApi {
    /** The full Twitch API surface. See {@linkcode TwitchApi}. */
    api: typeof TwitchApi;
}

/**
 * Access to this plugin's saved parameter values (the settings configured by
 * the user)
 */
export interface ScriptParametersApi {
    getAll<T extends Record<string, unknown> = Record<string, unknown>>(): T;
}

export interface ScriptFrontendCommunicatorApi {
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

export interface FirebotScriptApi {
    /** Running Firebot version, e.g. `"5.65.0"`. */
    version: string;
    /** Scoped logger. */
    logger: ScriptLoggerApi;
    /** Webhooks owned by this script. */
    webhooks: ScriptWebhooksApi;
    /** Simple persistent storage rooted at this script's data directory. */
    storage: ScriptStorageApi;
    /** Subscribe to and trigger Firebot events + register event sources. */
    events: ScriptEventsApi;
    /** Run effect lists. */
    effects: ScriptEffectsApi;
    /** Access to Firebot's Twitch API wrappers (Helix, chat, auth, etc). */
    twitch: ScriptTwitchApi;
    /** This plugin's saved parameter values. */
    parameters: ScriptParametersApi;
    /** Two-way messaging between the script and the frontend. */
    frontendCommunicator: ScriptFrontendCommunicatorApi;
}
