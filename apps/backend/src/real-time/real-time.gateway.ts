import { UseGuards } from "@nestjs/common";
import { OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { WsAuthGuard } from "../auth/ws-auth.guard";
import { from, map, Observable } from "rxjs";
import { Server } from 'ws';

@WebSocketGateway({ path: "/api/v1/realtime", })
@UseGuards(WsAuthGuard)
export class RealTimeGateway implements OnGatewayConnection {

    @WebSocketServer()
    server!: Server;

    @SubscribeMessage('events')
    onEvent(client: any, data: any): Observable<WsResponse<number>> {
        return from([1, 2, 3]).pipe(map(item => ({ event: 'events', data: item })));
    }

    handleConnection(client: any, ...args: any[]) {
        console.log("handleConnection", client, args);
    }
}