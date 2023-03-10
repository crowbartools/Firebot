'use strict';

const { platform } = require('node:os');
const { app, autoUpdater, ipcMain } = require('electron');
const logger = require("../logwrapper");
const getReleasesList = require('./get-releases-list');

const { processVersion } = require('./process-version');

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

module.exports = function setupUpdater() {

    const current = processVersion(app.getVersion());
    const isNightly = current.prerelease && current.prerelease.isNightly;

    ipcMain.handle('preload.updates.check', async () => {

        if (isDev || isNightly) {
            return {
                force: false,
                dev: null,
                stable: null,
                'stable-minimum': null,
                series: null
            };
        }

        // eslint-disable-next-line prefer-const
        let {status, data: releases} = await getReleasesList(current);
        if (status === 'error') {
            logger.error('Failed to get github releases');
            return {
                status: "error",
                message: "Failed to get github releases list"
            };
        }

        // no releases
        if (releases == null) {
            return {
                status: 'ok',
                data: { force: false, dev: null, stable: null, 'stable-minimum': null, series: null }
            };
        }

        // filter out releases with a major version that does not match the current installation's
        releases = releases.filter(release => release.version.major === current.major);

        // on latest
        if (releases.length === 0 || releases[0].version.full === current.full) {
            return {
                status: 'ok',
                data: { force: false, dev: null, stable: null, 'stable-minimum': null, series: null }
            };
        }

        const latestDev = releases[0].version.prerelease ? releases[0] : null;

        // current installation's pre-release has been superceded
        if (latestDev != null && latestDev.version.minor === current.minor) {
            return {
                status: 'ok',
                data: { force: 'dev', dev: latestDev, stable: null, 'stable-minimum': null, series: null }
            };
        }


        const latestStable = releases.find(release => release.version.prerelease == null);

        // on latest stable
        if (latestStable.version.full === current.full) {
            return {
                status: 'ok',
                data: { force: false, dev: latestDev, stable: null, 'stable-minimum': null, series: null }
            };
        }

        const latestSeries = releases.find(release => release.version.minor === current.minor);
        if (!latestSeries) {
            return {
                status: 'error',
                message: 'unable to locate current installations version series info'
            };
        }

        // Check: current version is lagging too far behind stable releases
        const stableReleases = releases.filter(release => release.version.prerelease == null && release.version.minor > current.minor);
        if (stableReleases.length > 1) {
            return {
                status: 'ok',
                data: {
                    force: 'stable-minimum',
                    dev: latestDev,
                    stable: latestStable,
                    'stable-minimum': stableReleases[1],
                    series: null
                }
            };
        }

        // on latest for series
        if (latestSeries.version.full === current.full) {
            return {
                status: 'ok',
                data: { force: false, dev: latestDev, stable: latestStable, 'stable-minimum': null, series: null }
            };
        }

        return {
            status: 'ok',
            data: { force: 'series', dev: latestDev, stable: latestStable, 'stable-minimum': null, series: latestSeries }
        };
    });

    let updaterBusy = true;
    let updateDownloaded = false;
    ipcMain.handle('preload.updates.download', (event, tag) => {
        if (platform !== 'win32') {
            return {status: "error", message: "platform does not support auto updates"};
        }
        if (isNightly) {
            return {status: "error", message: "nightlies do not receive auto updates"};
        }
        if (updaterBusy) {
            return {status: "error", message: "auto-updater already running"};
        }

        updaterBusy = true;
        const feedURL = `https://github.com/crowbartools/Firebot/releases/download/${tag}`;
        return new Promise((resolve, reject) => {
            autoUpdater.once('update-downloaded', (...args) => {
                updaterBusy = false;
                updateDownloaded = true;
                resolve(args);
            });
            autoUpdater.once('error', message => {
                updaterBusy = false;
                reject(message);
            });
            autoUpdater.setFeedURL(feedURL);
            autoUpdater.checkForUpdates();
        });
    });

    ipcMain.on('preload.updates.install', () => {
        if (updateDownloaded) {
            autoUpdater.quitAndInstall();
        }
    });

    ipcMain.handle('preload.updates.downloading', () => {
        return updaterBusy;
    });

    ipcMain.handle('preload.updates.updatePending', () => {
        return updateDownloaded;
    });
};