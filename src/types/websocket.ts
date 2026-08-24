import type { Awaitable } from "./util-types";

export type WebSocketEventType =
"subscribe-events" |
"overlay-connected" |
"overlay-event" |
"send-to-overlay" |

"command:created" |
"command:updated" |
"command:deleted" |

"counter:created" |
"counter:updated" |
"counter:deleted" |

"custom-role:created" |
"custom-role:updated" |
"custom-role:deleted" |

"custom-variable:created" |
"custom-variable:updated" |
"custom-variable:deleted" |

"effect-queue:created" |
"effect-queue:updated" |
"effect-queue:length-updated" |
"effect-queue:deleted" |

"preset-effect-list:created" |
"preset-effect-list:updated" |
"preset-effect-list:deleted" |

"timer:created" |
"timer:updated" |
"timer:deleted";

export interface Message {
    type: string;
    id?: number | string;
    name: string;
    data?: unknown;
}
export interface InvokeMessage extends Message {
    type: "invoke";
    id: string | number;
    data: unknown;
}
export interface ResponseMessage extends Message {
    type: "response";
    id: number | string;
    name: "error" | "success";
}
export interface EventMessage extends Message {
    type: "event";
}

export interface InvokePluginMessage extends InvokeMessage {
    name: "plugin";
    pluginName: string;
}

export interface PluginWebSocketHandler {
    pluginName: string;
    handler: (data: unknown) => Awaitable<void>;
}

export interface InvokeOverlayRequestMessage extends InvokeMessage {
    name: "overlay-request";
    data: {
        name: string;
        data?: Record<string, unknown>;
    };
}

export interface OverlayRequestWebSocketHandler<TData extends Record<string, unknown> = Record<string, unknown>, TResponse = unknown> {
    name: string;
    handler: (data: TData) => Awaitable<TResponse>;
}

export type OverlayConnectedData = {
    instanceName: string;
};