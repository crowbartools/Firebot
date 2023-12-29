import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server,  } from 'ws';

@WebSocketGateway({ path: "/api/v1/realtime" })
export class RealTimeGateway {
  constructor() {}

  @WebSocketServer()
  server!: Server;
}