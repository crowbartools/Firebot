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

interface Message {
    type: string;
    id?: number|string;
    name: string;
    data?: unknown;
}
interface InvokeMessage extends Message {
    type: "invoke";
    id: string|number;
    data: unknown;
}
interface ResponseMessage extends Message {
    type: "response";
    id: number|string;
    name: "error"|"success";
}
interface EventMessage extends Message {
    type: "event"
}

interface InvokePluginMessage extends InvokeMessage {
    name: "plugin";
    pluginName: string;
}

interface CustomWebSocketHandler {
    pluginName: string;
    callback: (data: unknown | unknown[]) => Promise<void> | void;
}

export type OverlayConnectedData = {
    instanceName: string;
}