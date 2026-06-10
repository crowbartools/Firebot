// Lightweight API + WebSocket helpers for the hosted Control Deck page.

import type { ControlDeckSettings, ControlDeckView, ControlInputValues, DeckSummary } from "./types.mjs";

const PIN_STORAGE_KEY = "firebot-control-deck-pin";

export class ApiError extends Error {
    code?: number;

    constructor(message: string, code?: number) {
        super(message);
        this.name = "ApiError";
        this.code = code;
    }
}

export function getStoredPin(): string {
    try {
        return window.localStorage.getItem(PIN_STORAGE_KEY) || "";
    } catch {
        return "";
    }
}

export function setStoredPin(pin: string): void {
    try {
        if (pin) {
            window.localStorage.setItem(PIN_STORAGE_KEY, pin);
        } else {
            window.localStorage.removeItem(PIN_STORAGE_KEY);
        }
    } catch {
        // ignore storage errors
    }
}

function authHeaders(): Record<string, string> {
    const pin = getStoredPin();
    return pin ? { "x-control-deck-pin": pin } : {};
}

export async function fetchControlDeckSettings(): Promise<ControlDeckSettings> {
    const res = await fetch("/api/v1/control-deck/settings");
    if (!res.ok) {
        throw new ApiError(`auth-required failed: ${res.status}`, res.status);
    }
    return res.json() as Promise<ControlDeckSettings>;
}

export async function fetchDecks(): Promise<DeckSummary[]> {
    const res = await fetch("/api/v1/control-deck/decks", { headers: authHeaders() });
    if (res.status === 401) {
        throw new ApiError("unauthorized", 401);
    }
    if (!res.ok) {
        throw new ApiError(`decks failed: ${res.status}`, res.status);
    }
    return res.json() as Promise<DeckSummary[]>;
}

export async function fetchDeck(deckId: string): Promise<ControlDeckView> {
    const res = await fetch(`/api/v1/control-deck/decks/${encodeURIComponent(deckId)}`, { headers: authHeaders() });
    if (res.status === 401) {
        throw new ApiError("unauthorized", 401);
    }
    if (!res.ok) {
        throw new ApiError(`deck failed: ${res.status}`, res.status);
    }
    return res.json() as Promise<ControlDeckView>;
}

export async function pressControl(deckId: string, controlId: string, inputValues?: ControlInputValues): Promise<boolean> {
    const res = await fetch(
        `/api/v1/control-deck/decks/${encodeURIComponent(deckId)}/controls/${encodeURIComponent(controlId)}/press`,
        {
            method: "POST",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ inputValues: inputValues ?? {} })
        }
    );
    if (res.status === 401) {
        throw new ApiError("unauthorized", 401);
    }
    return res.ok;
}

interface WsHandlers {
    onEvent?: (name: string, data: unknown) => void;
    onStatus?: (status: boolean) => void;
}

interface ControlDeckWsMessage {
    type?: string;
    name?: string;
    data?: unknown;
}

// Reconnecting WebSocket that notifies on Control Deck events.
export function connectWebSocket({ onEvent, onStatus }: WsHandlers): { close(): void } {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    function open(): void {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        ws = new WebSocket(`${protocol}//${window.location.host}`);

        ws.addEventListener("open", () => {
            ws?.send(JSON.stringify({
                type: "invoke",
                id: 1,
                name: "control-deck-connected",
                data: []
            }));
            onStatus?.(true);
        });

        ws.addEventListener("message", (msg: MessageEvent) => {
            try {
                const parsed = JSON.parse(msg.data as string) as ControlDeckWsMessage;
                if (parsed.type === "event" && typeof parsed.name === "string"
                    && parsed.name.startsWith("control-deck:")) {
                    onEvent?.(parsed.name, parsed.data);
                }
            } catch {
                // ignore malformed messages
            }
        });

        ws.addEventListener("close", () => {
            onStatus?.(false);
            if (!closed) {
                scheduleReconnect();
            }
        });

        ws.addEventListener("error", () => {
            ws?.close();
        });
    }

    function scheduleReconnect(): void {
        if (reconnectTimer != null) {
            clearTimeout(reconnectTimer);
        }
        reconnectTimer = setTimeout(open, 2000);
    }

    open();

    return {
        close(): void {
            closed = true;
            if (reconnectTimer != null) {
                clearTimeout(reconnectTimer);
            }
            ws?.close();
        }
    };
}
