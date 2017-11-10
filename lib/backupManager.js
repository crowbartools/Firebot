'use strict';

const settings = require('./common/settings-access').settings;
const dataAccess = require('./common/data-access.js');
const path = require('path');
const fs = require('fs');

function startBackup(manualActivation = false, callback) {
    console.log("Backup manualActivation: " + manualActivation);
    let archiver = require('archiver');
    let backupKeepAll = settings.backupKeepAll();
    let backupOnExit = settings.backupOnExit();
    let backupBeforeUpdates = settings.backupBeforeUpdates();
    let timestamp = Date.now();
    let fileExtension = 'zip';
    let filename = 'backup.' + fileExtension;

    if (backupKeepAll) {
        filename = 'backup-' + timestamp + '.' + fileExtension;
    }
    let backupPath = path.resolve(dataAccess.getUserDataPath() + path.sep + "backups");
    let folderPath = path.resolve(dataAccess.getUserDataPath() + path.sep + "user-settings");
    let output = fs.createWriteStream(backupPath + path.sep + filename);
    let archive = archiver(fileExtension, {
        zlib: { level: 9 } // Sets the compression level.
    });

    // listen for all archive data to be written
    output.on('close', function() {
        filesize = archive.pointer();
        if (callback instanceof Function) {
            callback();
        }
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
    archive.directory(folderPath, 'user-settings');

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    archive.finalize();
}

exports.startBackup = startBackup;
