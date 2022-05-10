"use strict";

(function() {

    const fs = require("fs-extra");
    const path = require("path");
    const unzipper = require("unzipper");
    const empty = require("empty-folder");

    angular
        .module("firebotApp")
        .factory("backupService", function($q, logger, backendCommunicator, listenerService,
            dataAccess, utilityService) {
            const service = {};

            const RESTORE_FOLDER_PATH = dataAccess.getPathInTmpDir("/restore");
            const USER_DATA_FOLDER_PATH = dataAccess.getPathInUserData("/");
            const PROFILES_FOLDER_PATH = dataAccess.getPathInUserData("/profiles");
            const BACKUPS_FOLDER_PATH = path.resolve(dataAccess.getUserDataPath() + path.sep + "backups") + path.sep;

            service.BACKUPS_FOLDER_PATH = BACKUPS_FOLDER_PATH;

            service.startBackup = function() {
                listenerService.fireEvent(listenerService.EventType.INITIATE_BACKUP, true);
            };

            service.openBackupZipFilePicker = function() {
                return $q.when(backendCommunicator.fireEventAsync("open-file-browser", {
                    options: {
                        title: "Select backup zip",
                        buttonLabel: "Select Backup",
                        filters: [{ name: "Zip", extensions: ["zip"] }]
                    },
                    currentPath: BACKUPS_FOLDER_PATH
                }))
                    .then(response => {
                        if (response == null || response.path == null) {
                            return null;
                        }

                        return response.path;
                    });
            };

            service.initiateBackupRestore = function(backupFilePath) {
                utilityService.showModal({
                    component: "restoreBackupModal",
                    keyboard: false,
                    backdrop: "static",
                    size: "sm",
                    resolveObj: {
                        backupFilePath: () => backupFilePath
                    }
                });
            };

            function validateBackupZip(backupFilePath) {
                let foundProfilesFolder = false;
                let foundGlobalSettingsJson = false;
                return fs.createReadStream(backupFilePath)
                    .pipe(unzipper.Parse() //eslint-disable-line new-cap
                        .on('entry', entry => {
                            if (entry.path.includes("profiles")) {
                                foundProfilesFolder = true;
                            } else if (entry.path.includes("global-settings")) {
                                foundGlobalSettingsJson = true;
                            }
                            entry.autodrain();
                        }))
                    .promise()
                    .then(() => {
                        return foundProfilesFolder && foundGlobalSettingsJson;
                    });
            }

            function clearRestoreFolder() {
                return new Promise(resolve => {
                    empty(RESTORE_FOLDER_PATH, false, o => {
                        if (o.error) {
                            logger.warn(o.error);
                        }
                        resolve();
                    });
                });
            }

            function extractBackupZip(backupFilePath) {
                return new Promise(resolve => {
                    fs.createReadStream(backupFilePath).pipe(
                        unzipper
                            .Extract({ path: RESTORE_FOLDER_PATH }) //eslint-disable-line new-cap
                            .on("close", () => {
                                logger.debug("Extracted backup zip!");
                                resolve();
                            })
                    );
                });
            }

            function clearProfilesFolder() {
                return new Promise((resolve, reject) => {
                    empty(PROFILES_FOLDER_PATH, false, o => {
                        if (o.error) {
                            logger.error(o.error);
                            return reject();
                        }
                        resolve();
                    });
                });
            }

            function copyRestoreFilesToUserData() {
                return new Promise((resolve, reject) => {
                    fs.copy(RESTORE_FOLDER_PATH, USER_DATA_FOLDER_PATH, { errorOnExist: false }, function(err) {
                        if (err) {
                            logger.error("Failed to copy backup data!");
                            logger.error(err);
                            reject();
                        } else {
                            logger.info('Copied backup data');
                            resolve();
                        }
                    });
                });
            }


            service.restoreBackup = async (backupFilePath) => {

                // Validate backup zip
                try {
                    const valid = await validateBackupZip(backupFilePath);
                    if (!valid) {
                        return {
                            success: false,
                            reason: "Provided zip is not a valid Firebot V5 backup."
                        };
                    }
                } catch (error) {
                    return {
                        success: false,
                        reason: "Failed to validate the backup zip."
                    };
                }

                // Clear out the /restore folder
                await clearRestoreFolder();

                // Extract the backup zip to the /restore folder
                await extractBackupZip(backupFilePath);

                // Clear out the profiles folder
                try {
                    await clearProfilesFolder();
                } catch (error) {
                    return {
                        success: false,
                        reason: "Failed to clear profiles folder."
                    };
                }

                try {
                    await copyRestoreFilesToUserData();
                } catch (error) {
                    return {
                        success: false,
                        reason: "Failed to copy restore files to user data."
                    };
                }

                return {
                    success: true
                };
            };

            return service;
        });
}());
