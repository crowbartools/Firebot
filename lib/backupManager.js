'use strict';

const settings = require('./common/settings-access').settings;
const dataAccess = require('./common/data-access.js');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const logger = require('./logwrapper');

let backupFolderPath = path.resolve(dataAccess.getUserDataPath() + path.sep + "backups") + path.sep;

function cleanUpOldBackups(callback) {
    let maxBackups = settings.maxBackupCount();

    if (maxBackups !== "All") {
        fs.readdir(backupFolderPath, (err, files) => {
            let fileNames =
                files.map(function(v) {
                    return { name: v,
                        time: fs.statSync(backupFolderPath + v).birthtime.getTime()
                    };
                }).sort(function(a, b) {
                    return b.time - a.time;
                }).map(function(v) {
                    return v.name;
                }).filter(n => {
                    return !n.includes("NODELETE") && n.endsWith(".zip");
                });

            fileNames.splice(0, maxBackups);

            fileNames.forEach(f => {
                logger.info("deleting old backup: " + f);
                fs.unlink(backupFolderPath + f);
            });

            if (callback instanceof Function) {
                callback();
            }
        });
    } else {
        if (callback instanceof Function) {
            callback();
        }
    }
}

function startBackup(manualActivation = false, callback) {
    logger.info("Backup manualActivation: " + manualActivation);
    let archiver = require('archiver');

    let version = app.getVersion(),
        milliseconds = Date.now(),
        fileExtension = 'zip';

    let filename = `backup_${milliseconds}_v${version}${manualActivation ? "_manual" : ""}.${fileExtension}`;

    let output = fs.createWriteStream(backupFolderPath + filename);
    let archive = archiver(fileExtension, {
        zlib: { level: 9 } // Sets the compression level.
    });

    // listen for all archive data to be written
    output.on('close', function() {
        settings.setLastBackupDate(new Date());
        cleanUpOldBackups(callback);
    });

    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
            // log warning
            if (manualActivation) renderWindow.webContents.send('error', "There was an error starting a backup.");
            renderWindow.webContents.send('error', err);
        } else {
            // throw error
            if (manualActivation) renderWindow.webContents.send('error', "Something bad happened, please check your logs.");
            renderWindow.webContents.send('error', err);
            throw err;
        }
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
        throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);

    // Add directory to package
    let folderPath = path.resolve(dataAccess.getUserDataPath() + path.sep + "user-settings");
    archive.directory(folderPath, 'user-settings');

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    archive.finalize();
}

function onceADayBackUpCheck() {
    let shouldBackUp = settings.backupOnceADay(),
        lastBackupDate = settings.lastBackupDate(),
        todayDate = new Date();

    if (shouldBackUp) {
        let isSameDay = (lastBackupDate != null && lastBackupDate.getDate() === todayDate.getDate()
            && lastBackupDate.getMonth() === todayDate.getMonth()
            && lastBackupDate.getFullYear() === todayDate.getFullYear());

        if (!isSameDay) {
            logger.info("Doing once a day backup");
            startBackup();
        }
    }
}

exports.onceADayBackUpCheck = onceADayBackUpCheck;
exports.startBackup = startBackup;
