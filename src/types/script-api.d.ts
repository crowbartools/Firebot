// Public contract types for the Firebot Script API.
//
// Everything a custom script can touch via `require("firebot")` should be
// defined here

import type winston from "winston";

export type ScriptLoggerApi = Pick<
    winston.LoggerInstance,
    "debug" | "info" | "warn" | "error"
>;

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

export interface ScriptFsDirEntry {
    /** File or directory name */
    name: string;
    /** Path relative to the script's data dir */
    relativePath: string;
    isFile: boolean;
    isDirectory: boolean;
}

export interface ScriptFsApi {
    /** Absolute path to this script's data directory. Read-only. */
    readonly dataDir: string;

    /** Resolve a sandboxed relative path to an absolute one. Throws on escape. */
    resolve(relativePath: string): string;

    exists(relativePath: string): Promise<boolean>;

    readText(relativePath: string, encoding?: BufferEncoding): Promise<string>;
    writeText(relativePath: string, contents: string, encoding?: BufferEncoding): Promise<void>;

    readBytes(relativePath: string): Promise<Buffer>;
    writeBytes(relativePath: string, contents: Buffer | Uint8Array): Promise<void>;

    /** Read JSON. Returns `null` if the file doesn't exist. */
    readJson(relativePath: string): Promise<unknown>;
    /** Write JSON pretty-printed with 2-space indent. */
    writeJson(relativePath: string, value: unknown): Promise<void>;

    /** Create a directory (and any missing parents). */
    mkdir(relativePath: string): Promise<void>;
    /** Delete a file or directory recursively. No-op if it doesn't exist. */
    remove(relativePath: string): Promise<void>;

    /** List immediate children of a directory (defaults to the data dir root). */
    list(relativePath?: string): Promise<ScriptFsDirEntry[]>;
}

export interface FirebotScriptApi {
    /** Running Firebot version, e.g. `"5.65.0"`. */
    version: string;
    /** Scoped logger. */
    logger: ScriptLoggerApi;
    /** Webhooks owned by this script. */
    webhooks: ScriptWebhooksApi;
    /** Sandboxed filesystem rooted at this script's data directory. */
    fs: ScriptFsApi;
}
