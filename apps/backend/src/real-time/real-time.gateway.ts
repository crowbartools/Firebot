import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, WebSocket } from "ws";

@WebSocketGateway({ path: "/api/v1/realtime" })
export class RealTimeGateway {
  constructor() {}

  @WebSocketServer()
  server!: Server;

  broadcast(event: string, data: unknown) {
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, data }));
      }
    });
  }
}