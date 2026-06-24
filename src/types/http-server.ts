import type { Request, Response } from "express";
import type { Awaitable } from "./util-types";

export type HttpMethod =
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE"
    | "HEAD"
    | "CONNECT"
    | "OPTIONS"
    | "TRACE";

export interface CustomHttpRoute {
    path: string;
    method: HttpMethod;
    handler: (req: Request, res: Response) => Awaitable<void>;
}

/**
 * Defines custom HTTP routes that plugins can add to the internal Firebot HTTP server.
 * Paths can contain multiple levels and parameters (e.g. `/item/:id`).
 * Full routes are built as follows (default Firebot hostname/port used as an example):
 *
 * `{method} http://localhost:7472/plugins/{prefix}/{path}`
 */
export interface PluginHttpRouteDefinition {
    prefix: string;
    routes: Array<CustomHttpRoute>;
}