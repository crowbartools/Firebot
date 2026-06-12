/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { PluginLoggerApi } from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";

export const createLoggerApi = definePluginApiNamespace<PluginLoggerApi>((ctx) => {
    const log = ctx.logger;
    return {
        debug: log.debug.bind(log),
        info: log.info.bind(log),
        warn: log.warn.bind(log),
        error: log.error.bind(log)
    };
});
