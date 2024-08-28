"use strict";

const { whenReady } = require("./events/when-ready");
const { windowsAllClosed } = require("./events/windows-all-closed");
const { willQuit } = require("./events/will-quit");
const { secondInstance } = require("./events/second-instance");
const { openUrl } = require("./events/open-url");
const { openFile } = require("./events/open-file");

module.exports = {
    whenReady,
    windowsAllClosed,
    willQuit,
    secondInstance,
    openUrl,
    openFile
};