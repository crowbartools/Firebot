import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";
import Transport from "winston-transport";
import { TransformableInfo } from "logform";
import { app } from "electron";
import os from "os";
import fs from "fs";
import { getPathInUserData, getJsonDbInUserData } from "./common/data-access";
import frontendCommunicator from "./common/frontend-communicator";

const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss.SSS";
const LOG_FOLDER = getPathInUserData("/logs");

let fileLogLevel = "info";
let debugMode = false;

try {
    debugMode = getJsonDbInUserData("/global-settings").getData("/settings/debugMode") as boolean;
} catch {}

if (debugMode === true) {
    fileLogLevel = "debug";
}

if (!fs.existsSync(LOG_FOLDER)) {
    fs.mkdirSync(LOG_FOLDER);
}

function formatMetadata(meta: object) {
    const splat = meta[Symbol.for('splat')] as unknown[];

    if (splat?.length) {
        // Pad so we have a space after the message
        return ` ${splat.map(s => JSON.stringify(s, Object.getOwnPropertyNames(s ?? {}))).join("; ")}`;
    }

    return '';
};

// Custom transport to send logs to the frontend
class FrontendTransport extends Transport {
    constructor(opts: Transport.TransportStreamOptions) {
        super(opts);
    }

    log(info :TransformableInfo, callback: () => void) {
        setImmediate(() => this.emit("logged", info));

        frontendCommunicator.send("logging", {
            message: info[Symbol.for("message")],
            meta: info[Symbol.for("splat")]
        });

        if (callback) {
            callback();
        }
    }
}

function getLogFormat(addMetadataToMessage = true) {
    return format.combine(
        format.timestamp({ format: DATE_FORMAT }),
        format.printf(
        // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
            info => `[${info.timestamp}] [${info.level.toUpperCase()}] ${info.message}${addMetadataToMessage === true ? formatMetadata(info) : ""}`
        )
    );
}

const rotatingFileTransport = new transports.DailyRotateFile({
    format: getLogFormat(),
    level: fileLogLevel,
    dirname: LOG_FOLDER,
    filename: "%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxFiles: "7d",
    utc: true
});

const logger = createLogger({
    level: "silly",
    exitOnError: false,
    transports: [
        new FrontendTransport({
            format: format.combine(
                getLogFormat(false),
                format.colorize({ all: true })
            ),
            level: "silly"
        }),
        new transports.Console({
            format: format.combine(
                getLogFormat(),
                format.colorize({ all: true })
            ),
            level: "silly"
        }),
        rotatingFileTransport
    ]
});

rotatingFileTransport.on("rotate", () => {
    logger.info("Log rotated");
    logger.info(`Firebot v${app.getVersion()}; Platform: ${os.platform()} ${os.arch()}; Version: ${os.type()} ${os.release()}`);
});

process.on("uncaughtException", error => logger.error("Uncaught exception", error));
process.on("unhandledRejection", error => logger.error("Unhandled promise rejection", error));

export = logger;