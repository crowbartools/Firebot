/* eslint @typescript-eslint/no-unused-vars: 0*/
"use strict";
const electron = require("electron");
const { ipcRenderer } = electron;

const logger = require("../../backend/logwrapper");

//from old Gobal.js
const shell = require("electron").shell;

/**
 * Don't remove the below imports for now, they are available globally to all frontend files
 * TODO: Refactor to import these modules in the files that actually use them instead
 * of making them available globally here
 */
const fs = require("fs");
const request = require("request");
const List = require("list.js");
const path = require("path");

require("angular");
require("angular-aria");
require("angular-animate");
require("angular-route");
require("angular-sanitize");
require("angular-ui-bootstrap");
require("angular-ui-validate");
require("angularjs-slider");
require("../js/plugins/scroll-glue");
require("../../../node_modules/angular-ui-codemirror/src/ui-codemirror");
require("ui-select");
require("angular-ui-sortable");
require('ng-youtube-embed');
require("ng-toast");
require("../js/plugins/angular-summernote");
require("angular-translate");
require("../../../node_modules/angular-translate-loader-url/angular-translate-loader-url");
require("../../../node_modules/angular-translate-loader-static-files/angular-translate-loader-static-files");
require('countup.js-angular1');
require("angular-pageslide-directive");
require("angular-bootstrap-contextmenu");
require("../../../node_modules/tinycolor2/dist/tinycolor-min");
require("angularjs-color-picker");

const configureOpenRenderedLinksInDefaultBrowser = () => {
    document.querySelector('body').addEventListener('click', event => {
        if (event.target.tagName.toLowerCase() === 'a') {
            const href = event.target.href;
            if (href != null && href.length > 0 && href.toLowerCase().startsWith("http")) {
                event.preventDefault();
                shell.openExternal(href);
            }
        }
    });
};

function boot() {
    angular.bootstrap(document, ["firebotApp"], {
        strictDi: false
    });

    const { Titlebar, Color } = require('custom-electron-titlebar');

    new Titlebar({
        backgroundColor: Color.fromHex('#1E2023'),
        icon: "../images/logo_transparent_2.png"
    });

    configureOpenRenderedLinksInDefaultBrowser();
}

document.addEventListener("DOMContentLoaded", boot);

// Catch browser window (renderer) errors and log them via Winston
window.onerror = function(error, url, line) {
    let message = `(Renderer) ${error}`;
    if (url) {
        message += ` [url=${url}]`;
    }
    if (line) {
        message += ` [line=${line}]`;
    }
    logger.error(message, error);
};

// pointless fancy firebot at the top of the log
function printRow(colorOne, colorTwo, ...args) {
    let msg = "";
    const styles = [];

    const size = "13px";

    args.forEach(a => {
        msg += "%c   ";
        if (a === 1) {
            styles.push(`background:${colorOne};font-size:${size};`);
        } else {
            styles.push(`background:${colorTwo};font-size:${size};`);
        }
    });

    console.log(msg, ...styles); // eslint-disable-line no-console
}

const letterColor = "#EBB11F",
    spaceColor = "transparent",
    ruleColor = "darkgray";
/* eslint-disable no-multi-spaces */
console.log("%cWELCOME TO", "color:gray;font-weight:900;font-size:18px;"); // eslint-disable-line no-console
printRow(ruleColor, spaceColor,   1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);

printRow(letterColor, spaceColor, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1);
printRow(letterColor, spaceColor, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0);
printRow(letterColor, spaceColor, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0);
printRow(letterColor, spaceColor, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0);
printRow(letterColor, spaceColor, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0);

printRow(ruleColor, spaceColor,   1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
/* eslint-enable no-multi-spaces */

//extra line for breathing room
console.log(""); // eslint-disable-line no-console

function getLogLevelColor(level) {
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
            return "gray";
    }
}

// Prints all logs from the "console" transport into the Browser Console
/* eslint-disable no-console */
function printLogToBrowserConsole(transport, level, msg, meta) {
    if (transport != null && transport.name === "console") {
        if (msg != null && msg.trim() !== "(Renderer)") {
            // Only print if the msg isnt 'empty' aka has more than just the prefix
            console.log(
                `%c${level.toUpperCase()}%c ${msg}`,
                `color:${getLogLevelColor(level)}`,
                "color:gray"
            );
        }
        if (meta && Object.keys(meta).length > 0) {
            console.log(meta);
        }
    }
}
/* eslint-enable no-console */

// Back end log feed
ipcRenderer.on("logging", (event, data) => {
    const transport = data.transport,
        level = data.level,
        msg = data.msg,
        meta = data.meta;
    printLogToBrowserConsole(transport, level, msg, meta);
});

// front end log feed
logger.on("logging", (transport, level, msg, meta) => {
    printLogToBrowserConsole(transport, level, msg, meta);
});
