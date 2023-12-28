import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { WebSocket } from 'ws';

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const client: WebSocket = context.switchToWs().getClient();
    // client.
    // const sessionCookie = client.handshake.headers.cookie
    //   .split('; ')
    //   .find((cookie: string) => cookie.startsWith('session'))
    //   .split('=')[1];


    // console.log("cookies", client);
    return true;
  }
}