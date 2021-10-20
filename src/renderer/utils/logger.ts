import { LogLevel } from "SharedTypes/misc/logging";
import { serialize } from "SharedUtils";
import communicator from "./communicator";

console.log(communicator);

interface LeveledLogMethod {
    (message: string, ...meta: unknown[]): void;
    (message: unknown): void;
}

interface Logger {
    error: LeveledLogMethod;
    warn: LeveledLogMethod;
    info: LeveledLogMethod;
    debug: LeveledLogMethod;
    verbose: LeveledLogMethod;
    silly: LeveledLogMethod;
}

function getLogLevelColor(level: string) {
    switch (level) {
        case "error":
            return "#CC3128";
        case "warn":
            return "#E3D919";
        case "info":
            return "#0DAD4A";
        case "verbose":
            return "#11A7AB";
        case "debug":
            return "#2171C7";
        case "silly":
            return "#973EBB";
        default:
            return "none";
    }
}

/* eslint-disable no-console */
function printLogToBrowserConsole(
    level: string,
    msg: string,
    meta?: unknown[]
) {
    console.log(
        "%c" + level.toUpperCase() + "%c " + msg,
        `color:${getLogLevelColor(level)}`,
        "color:none"
    );
    if (meta?.length > 0) {
        console.log("Metadata: ", meta);
    }
}
/* eslint-enable no-console */

function log(level: LogLevel, message: string | unknown, meta: unknown[]) {
    let logMessage: string =
        typeof message === "string" ? message : serialize(message);

    if (meta != null && meta.length > 0) {
        logMessage += ` ${meta.map(serialize).join(" ")}`;
    }

    if (message) {
        printLogToBrowserConsole(level, `(Renderer) ${logMessage}`, meta);
        communicator.emit("rendererLog", {
            level,
            message: logMessage
        });
    }
}

function buildLogger(): Logger {
    const logger = {} as Logger;
    (
        ["error", "warn", "info", "verbose", "debug", "silly"] as LogLevel[]
    ).forEach((level) => {
        logger[level] = (message: string | unknown, ...meta: unknown[]) => {
            log(level, message, meta);
        };
    });
    return logger;
}

export const logger = buildLogger();

window.onerror = function (error, url, line) {
    let message = `${error}`;
    if (url) {
        message += ` [url=${url}]`;
    }
    if (line) {
        message += ` [line=${line}]`;
    }
    logger.error(message, error);
};

communicator.on("mainLog", ({ level, message, meta }) => {
    printLogToBrowserConsole(level, message, meta?.length > 0 ? meta : null);
});
