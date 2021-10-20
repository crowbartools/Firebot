import { app } from "electron";
import { LogLevel } from "SharedTypes/misc/logging";
import { serialize } from "SharedUtils";
import winston, { format, transports } from "winston";
import "winston-daily-rotate-file";
import Transport, { TransportStreamOptions } from "winston-transport";
import { communicator } from "SharedUtils";
import { getPathInFirebotData } from "./data-helpers";

const SPLAT = Symbol.for("splat");

class RendererProxyTransport extends Transport {
    constructor(opts: TransportStreamOptions) {
        super(opts);
    }

    log(info: winston.Logform.TransformableInfo, callback: VoidFunction) {
        setImmediate(() => this.emit("logged", info));

        if (!info.message?.includes("(Renderer)")) {
            if (communicator.ready()) {
                communicator.emit("mainLog", {
                    level: info.level as LogLevel,
                    message: info.message,
                    meta: info[SPLAT as never]
                });
            }
        }

        if (callback) callback();
    }
}

function fileLogTemplate(i: {
    level: string;
    message: string;
    [key: string]: unknown;
}): string {
    return `${i.level.toUpperCase()} (${i.timestamp}) [${i.label}] ${
        i.message
    }${i.stack ? `- ${i.stack}` : ""}`;
}

function consoleLogTemplate(info: winston.Logform.TransformableInfo): string {
    const { level, message, stack } = info;

    let output = `${level} ${message}`;

    if (stack) {
        output += ` - \n${stack}`;
    }

    const meta = info[Symbol.for("splat") as never] as unknown[];
    if (meta?.length > 0) {
        output += ` ${meta.map(serialize).join(" ")}`;
    }

    return output;
}

const consoleTransport = new transports.Console({
    level: "silly",
    format: winston.format.combine(
        winston.format.errors({
            stack: true
        }),
        format((info) => {
            if (info.level) {
                info.level = info.level.toUpperCase();
            }
            return info;
        })(),
        winston.format.colorize(),
        winston.format.printf(consoleLogTemplate)
    )
});

const rotateFileTransport = new transports.DailyRotateFile({
    level: "info",
    filename: "%DATE%.log",
    dirname: getPathInFirebotData("/logs"),
    datePattern: "yyyy-MM-DD",
    json: false,
    maxFiles: "7d",
    format: winston.format.combine(
        winston.format.errors({
            stack: true
        }),
        winston.format.timestamp({
            format: "YYYY-MM-DD hh:mm:ss A"
        }),
        winston.format.label({
            label: `v${app.getVersion()}`
        }),
        winston.format.printf(fileLogTemplate)
    )
});

const rendererProxyTransport = new RendererProxyTransport({
    level: "silly"
});

export const logger = winston.createLogger({
    level: "silly",
    exitOnError: false,
    transports: [consoleTransport, rotateFileTransport, rendererProxyTransport]
});

process.on("uncaughtException", (error) => {
    logger.error("", error);
});
process.on("unhandledRejection", (reason) => {
    if (reason instanceof Error) {
        logger.error("(Unhandled rejection)", reason);
    } else {
        logger.error(`Unhandled rejection. Reason: ${reason}`);
    }
});

communicator.on("rendererLog", ({ level, message, stack }) => {
    logger[level](`(Renderer) ${message}${stack ? `- ${stack}` : ""}`);
});
