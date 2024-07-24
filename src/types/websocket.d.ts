export type WebSocketEventType =
"command:custom:updated" |
"command:custom:created" |
"command:custom:deleted" |

"command:system:created" |
"command:system:updated" |
"command:system:deleted" |

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

export type WebSocketMessageType =
"overlay-connected" |
"overlay-event" |
"subscribe" |
"event";

export type WebSocketEventData<T = unknown> = {
    eventType: WebSocketEventType;
    data: T;
}

export type OverlayEventData<T = unknown> = {
    name: string;
    data: T;
}

export type OverlayConnectedData = {
    instanceName: string;
}

export type WebSocketMessage<T = unknown> = {
    type: WebSocketMessageType;
    data: T;
}