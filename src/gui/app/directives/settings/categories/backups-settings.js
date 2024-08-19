"use strict";

(function() {

    const moment = require("moment");
    const path = require("path");
    const fs = require("fs");

    angular
        .module("firebotApp")
        .component("backupsSettings", {
            template: `
                <div>

                    <firebot-setting
                        name="Max Backups"
                        description="The maximum number of backups to keep. When Firebot makes a new backup, it will delete the oldest if this number has been reached."
                    >
                        <dropdown-select
                            ng-init="currentMaxBackups = settings.maxBackupCount()"
                            options="[3,5,10,25,'All']"
                            selected="currentMaxBackups"
                            on-update="settings.setMaxBackupCount(option)"
                            aria-label="Choose your Max Number of backups"

                        ></dropdown-select>
                    </firebot-setting>

                    <firebot-setting
                        name="Automatic Backup Options"
                        description="Choose what Firebot should ignore in automatic backups."
                    >
                        <div>
                        <label class="control-fb control--checkbox"
                            >Don't include overlay resource folder
                            <tooltip
                                text="'If your overlay-resource folder has become quite large, and slowing down the backup system turn this on. Note: Manual backups are not affected .'"
                            ></tooltip>
                            <input
                                type="checkbox"
                                ng-click="settings.setBackupIgnoreResources(!settings.backupIgnoreResources())"
                                ng-checked="settings.backupIgnoreResources()"
                                aria-label="Don't include overlay resource folder in backups"
                            />
                            <div class="control__indicator"></div>
                        </label>
                        </div>
                    </firebot-setting>

                    <firebot-setting
                        name="Automatic Backups"
                        description="Choose when Firebot should make automatic backups."
                    >
                        <div>
                        <label class="control-fb control--checkbox"
                            >When Firebot closes
                            <input
                                type="checkbox"
                                ng-click="settings.setBackupOnExit(!settings.backupOnExit())"
                                ng-checked="settings.backupOnExit()"
                                aria-label="Automatic update when Firebot closes"
                            />
                            <div class="control__indicator"></div>
                        </label>
                        <label class="control-fb control--checkbox"
                            >Once a day
                            <input
                                type="checkbox"
                                ng-click="settings.setBackupOnceADay(!settings.backupOnceADay())"
                                ng-checked="settings.backupOnceADay()"
                                aria-label="Automatic update Once a day"
                            />
                            <div class="control__indicator"></div>
                        </label>
                        <label class="control-fb control--checkbox"
                            >Before viewer purges
                            <tooltip
                                text="'Firebot will always backup before you do viewer purges (Database > View Purge Options)'"
                            ></tooltip>
                            <input
                                type="checkbox"
                                ng-checked="true"
                                aria-label="Automatic update Before viewer purges. Firebot will always backup before you do viewer purges"
                                disabled
                            />
                            <div class="control__indicator" disabled></div>
                        </label>
                        <label class="control-fb control--checkbox"
                            >Before updates
                            <tooltip
                                text="'Firebot will always back up before updates. This cannot be turned off. It\\'s for your own good <3'"
                            ></tooltip>
                            <input
                                type="checkbox"
                                ng-checked="true"
                                aria-label="Automatic update before updates. This cannot be turned off. It's for your own good <3"
                                disabled
                            />
                            <div class="control__indicator" disabled></div>
                        </label>
                        </div>
                    </firebot-setting>

                    <firebot-setting
                        name="Manual Backup"
                        description="Trigger a manual back up now."
                    >
                        <div>
                            <span
                                ng-if="isBackingUp || backupCompleted"
                                style="padding-left: 10px"
                            >
                                <span ng-if="isBackingUp"> Backing up... </span>
                                <span ng-if="backupCompleted" style="color: green">
                                    <i class="fal fa-check-circle"></i> Backup successful!
                                </span>
                            </span>
                            <firebot-button
                                text="Backup Now"
                                ng-click="startBackup()"
                                ng-disabled="isBackingUp"
                            />
                        </div>
                    </firebot-setting>

                    <firebot-setting
                        name="Backup Management"
                        description="View, restore, and delete previous backups."
                    >
                        <div>
                            <firebot-button
                                text="Manage Backups"
                                ng-click="showBackupListModal()"
                            />
                        </div>
                    </firebot-setting>

                </div>
          `,
            controller: function($scope, settingsService, backupService, backendCommunicator, $timeout, utilityService) {
                $scope.settings = settingsService;

                $scope.startBackup = function() {
                    $scope.isBackingUp = true;
                    $scope.backupCompleted = false;
                    backupService.startBackup();
                };

                backendCommunicator.on("backup-complete", (manualActivation) => {
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

                $scope.showBackupListModal = function() {
                    const showBackupListModalContext = {
                        templateUrl: "backupListModal.html",
                        size: "sm",
                        controllerFunc: (
                            $scope,
                            $uibModalInstance,
                            $q,
                            utilityService,
                            dataAccess
                        ) => {
                            $scope.backups = [];

                            const backupFolderPath = path.resolve(`${dataAccess.getUserDataPath() + path.sep}backups`) + path.sep;

                            $scope.loadingBackups = true;
                            $q
                                .when(
                                    new Promise((resolve) => {
                                        fs.readdir(backupFolderPath, (err, files) => {
                                            const backups = files
                                                .filter(f => f.endsWith(".zip"))
                                                .map(function(v) {
                                                    const fileStats = fs.statSync(backupFolderPath + v);
                                                    const backupDate = moment(fileStats.birthtime);

                                                    let version = "Unknown Version";
                                                    const versionRe = /_(v?\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+(?:\.\d+)?)?)(?:_|\b)/;
                                                    const match = v.match(versionRe);
                                                    if (match != null) {
                                                        version = match[1];
                                                    }

                                                    return {
                                                        name: v.replace(".zip", ""),
                                                        backupTime: backupDate.toDate().getTime(),
                                                        backupDateDisplay: backupDate.format(
                                                            "MMM Do, h:mm A"
                                                        ),
                                                        backupDateFull: backupDate.format(
                                                            "ddd, MMM Do YYYY, h:mm:ss A"
                                                        ),
                                                        fromNowDisplay: utilityService.capitalize(
                                                            backupDate.fromNow()
                                                        ),
                                                        dayDifference: moment().diff(backupDate, "days"),
                                                        version: version,
                                                        size: Math.round(fileStats.size / 1000),
                                                        isManual: v.includes("manual"),
                                                        neverDelete: v.includes("NODELETE")
                                                    };
                                                })
                                                .sort(function(a, b) {
                                                    return b.backupTime - a.backupTime;
                                                });

                                            resolve(backups);
                                        });
                                    })
                                )
                                .then((backups) => {
                                    $scope.loadingBackups = false;
                                    $scope.backups = backups;
                                });

                            $scope.togglePreventDeletion = function(backup) {
                                backup.neverDelete = !backup.neverDelete;
                                const oldName = `${backup.name}.zip`;
                                backup.name = backup.neverDelete
                                    ? (backup.name += "_NODELETE")
                                    : backup.name.replace("_NODELETE", "");

                                fs.renameSync(
                                    backupFolderPath + oldName,
                                    `${backupFolderPath + backup.name}.zip`
                                );
                            };

                            $scope.deleteBackup = function(index, backup) {
                                utilityService
                                    .showConfirmationModal({
                                        title: "Delete Backup",
                                        question: "Are you sure you'd like to delete this backup?",
                                        confirmLabel: "Delete"
                                    })
                                    .then((confirmed) => {
                                        if (confirmed) {
                                            $scope.backups.splice(index, 1);
                                            fs.unlinkSync(`${backupFolderPath + backup.name}.zip`);
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

                                            const backupFilePath =
                                                path.join(backupService.BACKUPS_FOLDER_PATH, `${backup.name}.zip`);

                                            backupService.initiateBackupRestore(backupFilePath);
                                        }
                                    });
                            };

                            $scope.openBackupFolder = function() {
                                backendCommunicator.fireEvent("open-backup-folder");
                            };

                            $scope.dismiss = function() {
                                $uibModalInstance.dismiss("cancel");
                            };
                        }
                    };
                    utilityService.showModal(showBackupListModalContext);
                };

            }
        });
}());
