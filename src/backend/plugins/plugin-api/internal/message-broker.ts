import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import type { Logger } from "winston";

import type { ScopedIpc } from "../../../../types/plugin-api";

const RESPONSE_CHANNEL = "__plugin:response__";
const REQUEST_CHANNEL_PREFIX = "__plugin:request:";
const DEFAULT_INVOKE_TIMEOUT_MS = 10_000;

interface PendingRequest {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
}

interface MessageResponse {
    requestId: string;
    error?: string;
    payload?: unknown;
}

interface MessageRequest {
    requestId: string;
    sender: string;
    payload: unknown;
}

type EmitListener = { channel: string, original: unknown, listener: (...args: never[]) => void };

export interface MessagingScope {
    ipc: ScopedIpc;
    dispose: () => void;
}

const requestChannelFor = (channel: PropertyKey): string =>
    `${REQUEST_CHANNEL_PREFIX}${String(channel)}__`;

class PluginMessageBroker {
    private readonly bus = new EventEmitter();
    private readonly pendingRequests = new Map<string, PendingRequest>();

    constructor() {
        this.bus.setMaxListeners(0);

        this.bus.on(RESPONSE_CHANNEL, ({ requestId, error, payload }: MessageResponse) => {
            const pending = this.pendingRequests.get(requestId);
            if (!pending) {
                return;
            }
            this.pendingRequests.delete(requestId);
            if (error != null) {
                pending.reject(new Error(error));
            } else {
                pending.resolve(payload);
            }
        });
    }

    /**
     * Deep-clone a payload to:
     * - Isolate senders/receivers from shared mutable references
     * - Reject non-serializable payloads (ie functions)
     */
    private enforceSerialization<T>(data: T): T {
        if (data === undefined) {
            return undefined as T;
        }
        try {
            return structuredClone(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new TypeError(
                `Messaging serialization error: payload contains non-serializable elements. ${message}`
            );
        }
    }

    createScope(pluginId: string, logger: Logger): MessagingScope {
        const emitListeners: EmitListener[] = [];
        const requestListeners: Array<{ channel: string, listener: (...args: never[]) => void }> = [];
        const scopedRequestIds = new Set<string>();

        const ipc: ScopedIpc = {
            emit: (channel, data) => {
                const payload = this.enforceSerialization(data);
                this.bus.emit(String(channel), { sender: pluginId, payload });
            },

            on: (channel, callback) => {
                const channelName = String(channel);
                const listener = (event: unknown) => {
                    try {
                        (callback as (event: unknown) => void)(event);
                    } catch (err) {
                        logger.warn(`messaging listener for "${channelName}" threw`, err);
                    }
                };

                this.bus.on(channelName, listener);
                const entry: EmitListener = { channel: channelName, original: callback, listener };
                emitListeners.push(entry);

                return () => {
                    this.bus.off(channelName, listener);
                    const idx = emitListeners.indexOf(entry);
                    if (idx !== -1) {
                        emitListeners.splice(idx, 1);
                    }
                };
            },

            off: (channel, callback) => {
                const channelName = String(channel);
                const idx = emitListeners.findIndex(
                    e => e.channel === channelName && e.original === callback
                );
                if (idx !== -1) {
                    this.bus.off(channelName, emitListeners[idx].listener);
                    emitListeners.splice(idx, 1);
                }
            },

            invoke: (channel, data) => {
                const payload = this.enforceSerialization(data);
                const requestId = randomUUID();

                return new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        if (this.pendingRequests.delete(requestId)) {
                            scopedRequestIds.delete(requestId);
                            reject(
                                new Error(
                                    `Messaging timeout: no response on channel "${String(channel)}" within ${DEFAULT_INVOKE_TIMEOUT_MS}ms.`
                                )
                            );
                        }
                    }, DEFAULT_INVOKE_TIMEOUT_MS);

                    this.pendingRequests.set(requestId, {
                        resolve: (value) => {
                            clearTimeout(timeoutId);
                            scopedRequestIds.delete(requestId);
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
                            resolve(value as any);
                        },
                        reject: (err) => {
                            clearTimeout(timeoutId);
                            scopedRequestIds.delete(requestId);
                            reject(err);
                        }
                    });
                    scopedRequestIds.add(requestId);

                    this.bus.emit(requestChannelFor(channel), {
                        requestId,
                        sender: pluginId,
                        payload
                    } satisfies MessageRequest);
                });
            },

            handle: (channel, handlerFn) => {
                const channelName = requestChannelFor(channel);

                this.bus.removeAllListeners(channelName);
                for (let i = requestListeners.length - 1; i >= 0; i--) {
                    if (requestListeners[i].channel === channelName) {
                        requestListeners.splice(i, 1);
                    }
                }

                const listener = async ({ requestId, sender, payload }: MessageRequest) => {
                    try {
                        const result = await (handlerFn as (payload: unknown, sender: string) => unknown)(
                            payload,
                            sender
                        );
                        this.bus.emit(RESPONSE_CHANNEL, {
                            requestId,
                            payload: this.enforceSerialization(result)
                        } satisfies MessageResponse);
                    } catch (err) {
                        const message = err instanceof Error ? err.message : String(err);
                        logger.warn(`messaging handler for "${String(channel)}" threw`, err);
                        this.bus.emit(RESPONSE_CHANNEL, {
                            requestId,
                            error: message || "Execution error"
                        } satisfies MessageResponse);
                    }
                };

                this.bus.on(channelName, listener as (...args: never[]) => void);
                requestListeners.push({ channel: channelName, listener: listener as (...args: never[]) => void });
            }
        };

        const dispose = () => {
            for (const { channel, listener } of emitListeners) {
                this.bus.off(channel, listener);
            }
            emitListeners.length = 0;

            for (const { channel, listener } of requestListeners) {
                this.bus.off(channel, listener);
            }
            requestListeners.length = 0;

            // Reject any requests this plugin was awaiting
            for (const requestId of scopedRequestIds) {
                const pending = this.pendingRequests.get(requestId);
                if (pending) {
                    this.pendingRequests.delete(requestId);
                    pending.reject(new Error("Messaging cancelled: plugin was unloaded."));
                }
            }
            scopedRequestIds.clear();
        };

        return { ipc, dispose };
    }
}

export const pluginMessageBroker = new PluginMessageBroker();
