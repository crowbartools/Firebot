"use strict";
const { ipcRenderer, shell } = require("electron");

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
require("angular-ui-sortable");
require('ng-youtube-embed');
require("ng-toast");
require("../js/plugins/angular-summernote");
require("angular-translate");
require("../../../node_modules/angular-translate-loader-url/angular-translate-loader-url");
require("../../../node_modules/angular-translate-loader-static-files/angular-translate-loader-static-files");
require('countup.js-angular1');
require("angular-pageslide-directive");
require("../js/plugins/angular-bootstrap-contextmenu");
require("../../../node_modules/tinycolor2/dist/tinycolor-min");
require("angularjs-color-picker");

const configureOpenRenderedLinksInDefaultBrowser = () => {
    document.querySelector('body').addEventListener('click', (event) => {
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
    let message = `[Renderer] ${error}`;
    if (url) {
        message += ` [url=${url}]`;
    }
    if (line) {
        message += ` [line=${line}]`;
    }

    ipcRenderer.send("logging", {
        type: "error",
        message,
        meta: [error]
    });
};

// pointless fancy firebot at the top of the log
function printRow(colorOne, colorTwo, ...args) {
    let msg = "";
    const styles = [];

    const size = "13px";

    args.forEach((a) => {
        msg += "%c   ";
        if (a === 1) {
            styles.push(`background:${colorOne};font-size:${size};`);
        } else {
            styles.push(`background:${colorTwo};font-size:${size};`);
        }
    });

    console.log(msg, ...styles);
}

const letterColor = "#EBB11F",
    spaceColor = "transparent",
    ruleColor = "darkgray";

console.log("%cWELCOME TO", "color:gray;font-weight:900;font-size:18px;");
printRow(ruleColor, spaceColor, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);

printRow(letterColor, spaceColor, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1);
printRow(letterColor, spaceColor, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0);
printRow(letterColor, spaceColor, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0);
printRow(letterColor, spaceColor, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0);
printRow(letterColor, spaceColor, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0);

printRow(ruleColor, spaceColor, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);


//extra line for breathing room
console.log("");

// Back end log feed
ipcRenderer.on("logging", (event, data) => {
    console.log(data.message);

    if (data.meta && Object.keys(data.meta).length > 0) {
        console.log(data.meta);
    }
});