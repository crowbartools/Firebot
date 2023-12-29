import { INestApplicationContext } from "@nestjs/common";
import { WsAdapter } from "@nestjs/platform-ws";
import type { VerifyClientCallbackSync, Server as WsServer } from "ws";

export class CustomWsAdaptor extends WsAdapter {
  constructor(
    private authToken: string,
    appOrHttpServer?: INestApplicationContext | unknown
  ) {
    super(appOrHttpServer);
  }

  public create(
    _port: number,
    options?: Record<string, unknown> & {
      namespace?: string;
      server?: unknown;
      path?: string;
    } & WsServer["options"]
  ) {
    if(!options) {
        options = {};
    }

    const verifyClient: VerifyClientCallbackSync = ({ req }) => {
      const authToken = this.getCookie("auth", req.headers.cookie);
      return authToken === this.authToken;
    };

    options.verifyClient = verifyClient;

    return super.create(_port, options);
  }

  private getCookie(name: string, cookiesHeader?: string) {
    if (!cookiesHeader) {
      return undefined;
    }
    const cookies = cookiesHeader.split(";").reduce(
      (acc, cookie) => {
        const [cookieName, cookieValue] = cookie.split("=");
        acc[cookieName.trim()] = cookieValue;
        return acc;
      },
      {} as Record<string, string>
    );
    return cookies[name];
  }
}