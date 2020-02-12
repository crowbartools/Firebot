"use strict";
const electron = require("electron");
const { dialog } = electron;

const logger = require("../logwrapper");

const frontendCommunicator = require("./frontend-communicator");

frontendCommunicator.onAsync("open-file-browser", async data => {
    let uuid = data.uuid,
        options = data.options || {};

    let dialogResult = null;
    try {
        dialogResult = await dialog.showOpenDialog({
            title: options.title ? options.title : undefined,
            buttonLabel: options.buttonLabel ? options.buttonLabel : undefined,
            properties: options.directoryOnly ? ["openDirectory"] : ["openFile"],
            filters: options.filters ? options.filters : undefined,
            defaultPath: data.currentPath ? data.currentPath : undefined
        });
    } catch (err) {
        logger.debug("Unable to get file path", err);
    }

    let path = null;
    if (dialogResult && !dialogResult.canceled && dialogResult.filePaths != null && dialogResult.filePaths.length > 0) {
        path = dialogResult.filePaths[0];
    }

    return { path: path, id: uuid };
});