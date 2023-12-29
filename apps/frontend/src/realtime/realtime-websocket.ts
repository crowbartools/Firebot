import ReconnectingWebSocket from "reconnecting-websocket";


export const realTimeWs =
  typeof window === "undefined"
    ? undefined
    : new ReconnectingWebSocket("ws://localhost:3001/api/v1/realtime", [], {
        WebSocket: WebSocket,
      });


