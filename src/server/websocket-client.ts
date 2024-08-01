import WebSocket from "ws";

export class WebSocketClient extends WebSocket {
    registrationTimeout: ReturnType<typeof setTimeout>;
    type?: "overlay" | "events";
}