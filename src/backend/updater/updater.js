'use strict';

const { platform } = require('node:os');
const { app, ipcMain } = require('electron');
const logger = require("../logwrapper");
const getReleasesList = require('./get-releases-list');


const {
    processVersion,
    compareVersions
} = require('./process-version');

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;


module.exports = function setupUpdater() {

    const current = processVersion(app.getVersion());
    const isNightly = current.prerelease && current.prerelease.isNightly;

    ipcMain.handle('preload.updates.check', async (event) => {
        if (isDev || isNightly) {
            return false;
        }

        const releases = await getReleasesList(current.full);
        if (releases.status === 'error') {
            logger.error('Failed to get github releases');
            return false;
        }

        if (releases.data == null || releases.data.length === 0) {
            return false;
        }



        // temp response
    });


    ipcMain.handle('preload.updates.download', async (event, tag) => {
        if (platform !== 'win32') {
            return {status: "error", message: "platform does not support auto updates"};
        }
        if (isNightly) {
            return {status: "error", message: "nightlies do not receive auto updates"};
        }

        // temp response
        return false;
    });

    ipcMain.handle('preload.updates.install', async (event) => {

        // temp response
        return false;
    });
};