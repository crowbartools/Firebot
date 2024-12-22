"use strict";

(function() {
    const moment = require("moment");

    angular
        .module("firebotApp")
        .factory("backupService", function($q, backendCommunicator, utilityService) {
            const service = {};

            service.backupFolderPath = backendCommunicator.fireEventSync("backups:get-backup-folder-path");

            backendCommunicator.on("settings:setting-updated:BackupLocation", (newPath) => {
                service.backupFolderPath = newPath;
            });

            service.startBackup = function() {
                backendCommunicator.fireEvent("backups:start-backup", true);
            };

            service.openBackupFolder = function() {
                backendCommunicator.fireEvent("open-backup-folder");
            };

            service.openBackupZipFilePicker = function() {
                return $q.when(backendCommunicator.fireEventAsync("open-file-browser", {
                    options: {
                        title: "Select Firebot backup",
                        buttonLabel: "Select Backup",
                        filters: [{ name: "Zip", extensions: ["zip"] }]
                    },
                    currentPath: service.backupFolderPath
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
                return await backendCommunicator.fireEventAsync("backups:restore-backup", backupFilePath);
            };

            service.showBackupListModal = function() {
                const showBackupListModalContext = {
                    templateUrl: "backupListModal.html",
                    size: "sm",
                    controllerFunc: (
                        $scope,
                        $uibModalInstance,
                        $q,
                        utilityService
                    ) => {
                        $scope.backups = [];

                        $scope.loadingBackups = true;
                        $q
                            .when(backendCommunicator.fireEventAsync("backups:get-backup-list"))
                            .then((backups) => {
                                const formattedBackups = backups.map((b) => {
                                    const backupMoment = moment(b.backupDate);
                                    return {
                                        name: b.name,
                                        path: b.path,
                                        backupTime: b.backupDate,
                                        backupDateDisplay: backupMoment.format(
                                            "MMM Do, h:mm A"
                                        ),
                                        backupDateFull: backupMoment.format(
                                            "ddd, MMM Do YYYY, h:mm:ss A"
                                        ),
                                        fromNowDisplay: utilityService.capitalize(
                                            backupMoment.fromNow()
                                        ),
                                        dayDifference: moment().diff(backupMoment, "days"),
                                        version: b.version,
                                        size: Math.round(b.size / 1000),
                                        isManual: b.isManual,
                                        neverDelete: b.neverDelete
                                    };
                                });

                                $scope.loadingBackups = false;
                                $scope.backups = formattedBackups;
                            });

                        $scope.togglePreventDeletion = (backup) => {
                            backendCommunicator.send("backups:toggle-backup-prevent-deletion", backup.path);
                        };

                        $scope.deleteBackup = function(index, backup) {
                            utilityService
                                .showConfirmationModal({
                                    title: "Delete Backup",
                                    question: "Are you sure you want to delete this backup?",
                                    confirmLabel: "Delete"
                                })
                                .then((confirmed) => {
                                    if (confirmed) {
                                        backendCommunicator.fireEventAsync("backups:delete-backup", backup.path)
                                            .then((success) => {
                                                if (success) {
                                                    $scope.backups.splice(index, 1);
                                                }
                                            });
                                    }
                                });
                        };

                        $scope.restoreBackup = function(backup) {
                            utilityService
                                .showConfirmationModal({
                                    title: "Restore From Backup",
                                    question: "Are you sure you'd like to restore from this backup?",
                                    confirmLabel: "Restore"
                                })
                                .then((confirmed) => {
                                    if (confirmed) {
                                        $uibModalInstance.dismiss("cancel");
                                        service.initiateBackupRestore(backup.path);
                                    }
                                });
                        };

                        $scope.openBackupFolder = function() {
                            service.openBackupFolder();
                        };

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss("cancel");
                        };
                    }
                };
                utilityService.showModal(showBackupListModalContext);
            };

            service.initiateBackupFolderMove = () => {
                $q
                    .when(backendCommunicator.fireEventAsync("open-file-browser", {
                        options: {
                            title: "Select new Firebot backup location",
                            button: "Select Folder",
                            directoryOnly: true
                        },
                        currentPath: service.backupFolderPath
                    }))
                    .then((response) => {
                        if (response?.path != null) {
                            service.moveBackupFolder(response.path);
                        }
                    });
            };

            service.moveBackupFolder = async (newPath) => {
                return await backendCommunicator.fireEventAsync("backups:move-backup-folder", newPath);
            };

            return service;
        });
}());