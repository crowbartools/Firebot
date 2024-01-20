"use strict";

(function() {
    const { resolve } = require('path');

    angular
        .module("firebotApp")
        .factory("backupService", function($q, backendCommunicator,
            dataAccess, utilityService) {
            const service = {};

            const BACKUPS_FOLDER_PATH = resolve(dataAccess.getUserDataPath(), "backups");

            service.BACKUPS_FOLDER_PATH = BACKUPS_FOLDER_PATH;

            service.startBackup = function() {
                backendCommunicator.fireEvent("start-backup", true);
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
                    .then((response) => {
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


            service.restoreBackup = async (backupFilePath) => {
                return await backendCommunicator.fireEventAsync("restore-backup", backupFilePath);
            };

            return service;
        });
}());
