"use strict";

(function() {
    angular
        .module("firebotApp")
        .component("backupsSettings", {
            template: `
                <div>
                    <div><strong>NOTE: These settings affect ALL user profiles.</strong></div>

                    <firebot-setting
                        name="Max Backups"
                        description="The maximum number of backups to keep. When Firebot makes a new backup, it will delete the oldest if this number has been reached."
                    >
                        <dropdown-select
                            ng-init="currentMaxBackups = settings.getSetting('MaxBackupCount')"
                            options="[3,5,10,25,'All']"
                            selected="currentMaxBackups"
                            on-update="settings.saveSetting('MaxBackupCount', option)"
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
                                ng-click="settings.saveSetting('BackupIgnoreResources', !settings.getSetting('BackupIgnoreResources'))"
                                ng-checked="settings.getSetting('BackupIgnoreResources')"
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
                                ng-click="settings.saveSetting('BackupOnExit', !settings.getSetting('BackupOnExit'))"
                                ng-checked="settings.getSetting('BackupOnExit')"
                                aria-label="Automatic update when Firebot closes"
                            />
                            <div class="control__indicator"></div>
                        </label>
                        <label class="control-fb control--checkbox"
                            >Once a day
                            <input
                                type="checkbox"
                                ng-click="settings.saveSetting('BackupOnceADay', !settings.getSetting('BackupOnceADay'))"
                                ng-checked="settings.getSetting('BackupOnceADay')"
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
                                ng-click="backupService.showBackupListModal()"
                            />
                        </div>
                    </firebot-setting>

                    <firebot-setting
                        name="Move Backup Folder"
                        description="Choose where Firebot stores backups.">

                        <setting-description-addon>
                            <div style="margin-top: 10px;"><strong>NOTE</strong>: Changing this setting will copy any existing backups from the current location to the new location. This will overwrite any files with the same name in the new location.</div>
                            <div style="margin-top: 10px;">Current backup location: <a ng-click="backupService.openBackupFolder()" ng-bind="backupService.backupFolderPath" href></a></div>
                        </setting-description-addon>

                        <div>
                            <span
                                ng-if="isMovingBackupFolder || backupFolderMoveCompleted"
                                style="padding-left: 10px"
                            >
                                <span ng-if="isMovingBackupFolder"> Moving backups to new folder... </span>
                                <span ng-if="backupFolderMoveCompleted && backupFolderMoveSuccess" style="color: green">
                                    <i class="fal fa-check-circle"></i> Move successful!
                                </span>
                                <span ng-if="backupFolderMoveCompleted && !backupFolderMoveSuccess" style="color: red">
                                    <i class="fal fa-check-circle"></i> Move failed.
                                </span>
                            </span>
                            <firebot-button
                                text="Move Backup Folder"
                                ng-click="backupService.initiateBackupFolderMove()"
                                ng-disabled="isMovingBackupFolder"
                            />
                        </div>
                    </firebot-setting>

                </div>
          `,
            controller: function($scope, settingsService, backupService, backendCommunicator, $timeout) {
                $scope.settings = settingsService;
                $scope.backupService = backupService;

                $scope.startBackup = function() {
                    $scope.isBackingUp = true;
                    $scope.backupCompleted = false;
                    backupService.startBackup();
                };

                backendCommunicator.on("backups:backup-complete", (manualActivation) => {
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

                $scope.moveBackupFolder = () => {
                    $scope.isMovingBackupFolder = true;
                    $scope.backupFolderMoveCompleted = false;
                };

                backendCommunicator.on("backups:move-backup-folder-completed", (success) => {
                    $scope.isMovingBackupFolder = false;
                    $scope.backupFolderMoveCompleted = true;
                    $scope.backupFolderMoveSuccess = success;

                    // after 5 seconds, hide the completed message
                    $timeout(() => {
                        if ($scope.backupFolderMoveCompleted) {
                            $scope.backupFolderMoveCompleted = false;
                        }
                    }, 5000);
                });
            }
        });
}());