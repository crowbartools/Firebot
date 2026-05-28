/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ScriptLoggerApi } from "../../../../types/script-api";
import { defineScriptApiNamespace } from "../internal/define-namespace";

export const createLoggerApi = defineScriptApiNamespace<ScriptLoggerApi>((ctx) => {
    const log = ctx.logger;
    return {
        debug: log.debug.bind(log),
        info: log.info.bind(log),
        warn: log.warn.bind(log),
        error: log.error.bind(log)
    };
});
