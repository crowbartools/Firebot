'use strict';
(function() {

    //This handles the Settings tab

    const fs = require("fs");
    const path = require("path");
    const dataAccess = require("../../lib/common/data-access");
    const moment = require("moment");
    const unzipper = require("unzipper");
    const ncp = require("ncp");

    angular
        .module('firebotApp')
        .controller('settingsController', function($scope, $timeout, $q, settingsService,
            utilityService, listenerService, logger, connectionService) {

            $scope.settings = settingsService;

            $scope.canClip = connectionService.accounts.streamer.partnered
                || connectionService.accounts.streamer.canClip;

            $scope.clipsFolder = settingsService.getClipDownloadFolder();

            $scope.showSetupWizard = utilityService.showSetupWizard;

            $scope.openRootFolder = function() {
                listenerService.fireEvent(listenerService.EventType.OPEN_ROOT);
            };

            $scope.startBackup = function() {
                $scope.isBackingUp = true;
                $scope.backupCompleted = false;
                listenerService.fireEvent(listenerService.EventType.INITIATE_BACKUP, true);
            };

            $scope.currentMaxBackups = settingsService.maxBackupCount();

            $scope.updateMaxBackups = function(option) {
                settingsService.setMaxBackupCount(option);
            };

            $scope.audioOutputDevices = [{
                label: "System Default",
                deviceId: "default"
            }];

            $q.when(navigator.mediaDevices.enumerateDevices()).then(deviceList => {
                deviceList = deviceList.filter(d => d.kind === 'audiooutput' &&
                    d.deviceId !== "communications" &&
                    d.deviceId !== "default")
                    .map(d => {
                        return { label: d.label, deviceId: d.deviceId };
                    });

                $scope.audioOutputDevices = $scope.audioOutputDevices.concat(deviceList);
            });

            listenerService.registerListener(
                { type: listenerService.ListenerType.BACKUP_COMPLETE },
                function(manualActivation) {
                    $scope.isBackingUp = false;

                    if (manualActivation) {
                        // we only want to act if the backup was manually triggered
                        $scope.backupCompleted = true;
                        // after 5 seconds, hide the completed message
                        $timeout(() => {
                            if ($scope.backupCompleted) {
                                $scope.backupCompleted = false;
                            }
                        }, 5000);
                    }
                });

            if (settingsService.getAutoUpdateLevel() > 3) {
                settingsService.setAutoUpdateLevel(3);
            }

            $scope.autoUpdateSlider = {
                value: settingsService.getAutoUpdateLevel(),
                options: {
                    showSelectionBar: true,
                    showTicks: true,
                    showTicksValues: true,
                    stepsArray: [
                        {value: 2},
                        {value: 3}
                    ],
                    translate: function (value) {
                        return $scope.getAutoUpdateLevelString(value);
                    },
                    ticksTooltip: function (index) {
                        switch (index) {
                        case 0:
                            return "Updates that fix bugs or add features. (Example: v1.0 to v1.1.1)";
                        case 1:
                            return "Updates that are major new versions. Could contain breaking changes. (Example: v1.0 to v2.0)";
                        default:
                            return "";
                        }
                    },
                    getSelectionBarColor: function() {
                        return "orange";
                    },
                    getPointerColor: function() {
                        return "orange";
                    },
                    onChange: function() {
                        settingsService.setAutoUpdateLevel($scope.autoUpdateSlider.value);
                    }
                }
            };

            $scope.getAutoUpdateLevelString = function(level) {
                switch (level) {
                case 0:
                    return "Off";
                case 2:
                    return "Default";
                case 3:
                    return "Major Versions";
                case 4:
                    return "Betas";
                default:
                    return "";
                }
            };

            $scope.currentPort = settingsService.getWebSocketPort();

            function startRestoreFromBackup(backup) {

                let downloadModalContext = {
                    templateUrl: "./templates/misc-modals/restoringModal.html",
                    keyboard: false,
                    backdrop: 'static',
                    size: 'sm',
                    resolveObj: {
                        backup: () => {
                            return backup;
                        }
                    },
                    controllerFunc: ($scope, $uibModalInstance, $timeout, backup, settingsService, listenerService) => {

                        $scope.restoreComplete = false;
                        $scope.errorMessage = "";

                        $timeout(() => {
                            if (!$scope.restoreComplete && !$scope.restoreHasError) {
                                $scope.restoreHasError = true;
                                $scope.errorMessage = "Restore is taking longer than normal. There may have been an error. You can close and try again or check your log files and contact us. We are happy to help!";
                            }
                        }, 30 * 1000);

                        $scope.dismiss = function() {
                            if ($scope.restoreComplete) {
                                listenerService.fireEvent(listenerService.EventType.RESTART_APP);
                            } else {
                                $uibModalInstance.dismiss('cancel');
                            }
                        };

                        function reloadEverything() {
                            settingsService.purgeSettingsCache();

                            $scope.$applyAsync();

                            $scope.restoreComplete = true;
                        }

                        function copyFilesOver() {
                            let source = dataAccess.getPathInTmpDir("/restore/user-settings");
                            let destination = dataAccess.getPathInUserData("/user-settings");
                            ncp(source, destination, function (err) {
                                if (err) {
                                    logger.error("Failed to copy 'user-settings'!");
                                    logger.error(err);
                                    $scope.restoreHasError = true;
                                    $scope.errorMessage = "The restore failed when trying to copy data.";
                                } else {
                                    logger.info('Copied "user-settings" to user data.');
                                    reloadEverything();
                                }
                            });
                        }

                        function beginRestore() {
                            let backupFolderPath = path.resolve(dataAccess.getUserDataPath() + path.sep + "backups") + path.sep;
                            let backupName = backup.name + ".zip";
                            fs.createReadStream(backupFolderPath + backupName)
                                .pipe(
                                    unzipper.Extract({ path: dataAccess.getPathInTmpDir("/restore") }) //eslint-disable-line new-cap
                                        .on('close', () => {
                                            logger.info("extracted!");
                                            copyFilesOver();
                                        }));

                        }

                        $timeout(beginRestore, 2 * 1000);
                    }
                };
                utilityService.showModal(downloadModalContext);
            }
            /**
            * Modals
            */
            $scope.showBackupListModal = function() {
                let showBackupListModalContext = {
                    templateUrl: "backupListModal.html",
                    size: 'sm',
                    controllerFunc: ($scope, settingsService, $uibModalInstance, $q, listenerService, utilityService) => {

                        $scope.backups = [];

                        let backupFolderPath = path.resolve(dataAccess.getUserDataPath() + path.sep + "backups") + path.sep;

                        $scope.loadingBackups = true;
                        $q.when(new Promise(resolve => {
                            fs.readdir(backupFolderPath, (err, files) => {
                                let backups =
                                    files
                                        .filter(f => f.endsWith(".zip"))
                                        .map(function(v) {
                                            let fileStats = fs.statSync(backupFolderPath + v);
                                            let backupDate = moment(fileStats.birthtime);

                                            let version = "Unknown Version";
                                            let versionRe = /_(v?\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+(?:\.\d+)?)?)(?:_|\b)/;
                                            let match = v.match(versionRe);
                                            if (match != null) {
                                                version = match[1];
                                            }

                                            return {
                                                name: v.replace(".zip", ""),
                                                backupTime: backupDate.toDate().getTime(),
                                                backupDateDisplay: backupDate.format("MMM Do, h:mm A"),
                                                backupDateFull: backupDate.format("ddd, MMM Do YYYY, h:mm:ss A"),
                                                fromNowDisplay: utilityService.capitalize(backupDate.fromNow()),
                                                dayDifference: moment().diff(backupDate, 'days'),
                                                version: version,
                                                size: Math.round(fileStats.size / 1000),
                                                isManual: v.includes("manual"),
                                                neverDelete: v.includes("NODELETE")
                                            };
                                        }).sort(function(a, b) {
                                            return b.backupTime - a.backupTime;
                                        });

                                resolve(backups);
                            });
                        })).then(backups => {
                            $scope.loadingBackups = false;
                            $scope.backups = backups;
                        });

                        $scope.togglePreventDeletion = function(backup) {
                            backup.neverDelete = !backup.neverDelete;
                            let oldName = backup.name + ".zip";
                            backup.name = backup.neverDelete ? backup.name += "_NODELETE" : backup.name.replace("_NODELETE", "");

                            fs.renameSync(backupFolderPath + oldName, backupFolderPath + backup.name + ".zip");
                        };

                        $scope.deleteBackup = function(index, backup) {
                            utilityService.showConfirmationModal({
                                title: "Delete Backup",
                                question: "Are you sure you'd like to delete this backup?",
                                confirmLabel: "Delete"
                            }).then(confirmed => {
                                if (confirmed) {
                                    $scope.backups.splice(index, 1);
                                    fs.unlink(backupFolderPath + backup.name + ".zip");
                                }
                            });
                        };

                        $scope.restoreBackup = function(backup) {
                            utilityService.showConfirmationModal({
                                title: "Restore From Backup",
                                question: "Are you sure you'd like to restore from this backup?",
                                confirmLabel: "Restore"
                            }).then(confirmed => {
                                if (confirmed) {
                                    $uibModalInstance.dismiss('cancel');
                                    startRestoreFromBackup(backup);
                                }
                            });
                        };

                        $scope.openBackupFolder = function() {
                            listenerService.fireEvent(listenerService.EventType.OPEN_BACKUP);
                        };

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                };
                utilityService.showModal(showBackupListModalContext);
            };

            $scope.showChangePortModal = function() {
                let showChangePortModalContext = {
                    templateUrl: "changePortModal.html",
                    size: "sm",
                    controllerFunc: ($scope, settingsService, $uibModalInstance) => {

                        $scope.newPort = settingsService.getWebSocketPort();

                        $scope.newPortError = false;

                        // When the user clicks a call to action that will close the modal, such as "Save"
                        $scope.changePort = function() {

                            // validate port number
                            let newPort = $scope.newPort;
                            if (newPort == null
                                    || newPort === ''
                                    || newPort <= 1024
                                    || newPort >= 49151) {

                                $scope.newPortError = true;
                                return;
                            }

                            // Save port. This will save to both firebot and the overlay.
                            settingsService.setWebSocketPort(newPort);

                            $uibModalInstance.close(newPort);
                        };

                        // When they hit cancel, click the little x, or click outside the modal, we dont want to do anything.
                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss('cancel');
                        };
                    },
                    closeCallback: (port) => {
                        // Update the local port scope var so setting input updates
                        $scope.currentPort = port;
                    }
                };
                utilityService.showModal(showChangePortModalContext);
            };

            $scope.showEditOverlayInstancesModal = function() {
                let showEditOverlayInstancesModalContext = {
                    templateUrl: "editOverlayInstances.html",
                    controllerFunc: ($scope, settingsService, utilityService, $uibModalInstance) => {

                        $scope.getOverlayInstances = function() {
                            return settingsService.getOverlayInstances();
                        };

                        $scope.usingObs = settingsService.getOverlayCompatibility() === 'OBS';

                        $scope.deleteOverlayInstanceAtIndex = function(index) {
                            let instances = settingsService.getOverlayInstances();

                            instances.splice(index, 1);

                            settingsService.setOverlayInstances(instances);
                        };

                        let addOverlayInstance = function(overlayInstance) {
                            let instances = settingsService.getOverlayInstances();

                            instances.push(overlayInstance);

                            settingsService.setOverlayInstances(instances);
                        };

                        $scope.showViewUrlModal = function(instanceName) {
                            utilityService.showOverlayInfoModal(instanceName);
                        };

                        $scope.showCreateInstanceModal = function() {
                            let showCreateInstanceModalContext = {
                                templateUrl: "createOverlayInstance.html",
                                size: "sm",
                                controllerFunc: ($scope, settingsService, $uibModalInstance) => {

                                    $scope.name = "";

                                    $scope.create = function() {

                                        if (settingsService.getOverlayInstances().includes($scope.name) || $scope.name === "") {
                                            $scope.createError = true;
                                            return;
                                        }

                                        $uibModalInstance.close($scope.name);
                                    };

                                    $scope.dismiss = function() {
                                        $uibModalInstance.dismiss('cancel');
                                    };
                                },
                                closeCallback: (instanceName) => {
                                    addOverlayInstance(instanceName);
                                }
                            };
                            utilityService.showModal(showCreateInstanceModalContext);
                        };


                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                };
                utilityService.showModal(showEditOverlayInstancesModalContext);
            };

        });
}());
