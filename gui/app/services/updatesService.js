'use strict';

(function(angular) {

    //This handles updates
    const VersionCompare = require('../../lib/compare-versions');
    const UpdateType = VersionCompare.UpdateType;

    angular
        .module('firebotApp')
        .factory('updatesService', function (logger, $q, $http, $sce, settingsService, utilityService, listenerService) {
            // factory/service object
            let service = {};

            service.updateData = {};

            service.isCheckingForUpdates = false;

            service.hasCheckedForUpdates = false;

            service.updateIsAvailable = function() {
                return service.hasCheckedForUpdates ? service.updateData.updateIsAvailable : false;
            };

            // Update Checker
            // This checks for updates.
            service.checkForUpdate = function() {
                service.isCheckingForUpdates = true;

                function shouldAutoUpdate(autoUpdateLevel, updateType) {
                    // if auto updating is completely disabled
                    if (autoUpdateLevel === 0) {
                        return false;
                    }

                    // check each update type
                    switch (updateType) {
                    case UpdateType.PRERELEASE:
                        return autoUpdateLevel >= 4;
                    case UpdateType.OFFICIAL:
                    case UpdateType.PATCH:
                        return autoUpdateLevel >= 1;
                    case UpdateType.MINOR:
                        return autoUpdateLevel >= 2;
                    case UpdateType.NONE:
                    case UpdateType.MAJOR:
                    case UpdateType.MAJOR_PRERELEASE:
                    default:
                        return false;
                    }
                }

                return $q((resolve) => {

                    let firebotReleasesUrl = "https://api.github.com/repos/Firebottle/Firebot/releases/latest";

                    if (settingsService.notifyOnBeta()) {
                        firebotReleasesUrl = "https://api.github.com/repos/Firebottle/Firebot/releases";
                    }

                    $http.get(firebotReleasesUrl).then((response) => {
                        // Get app version
                        let currentVersion = require('electron').remote.app.getVersion();

                        // Parse github api to get tag name.
                        let gitNewest = {};
                        if (response.data.length > 0) {
                            gitNewest = response.data[0];
                        } else {
                            gitNewest = response.data;
                        }

                        let gitName = gitNewest.name;
                        let gitDate = gitNewest.published_at;
                        let gitLink = gitNewest.html_url;
                        let gitNotes = marked(gitNewest.body);
                        let gitZipDownloadUrl = gitNewest.assets[0].browser_download_url;

                        // Now lets look to see if there is a newer version.
                        let updateType = VersionCompare.compareVersions(gitNewest.tag_name, currentVersion);

                        let updateIsAvailable = false, updateIsMajorRelease = false;
                        if (updateType !== UpdateType.NONE) {
                            let autoUpdateLevel = settingsService.getAutoUpdateLevel();

                            if (updateType === UpdateType.MAJOR || updateType === UpdateType.MAJOR_PRERELEASE) {
                                updateIsMajorRelease = true;
                            }

                            // Check if we should auto update based on the users setting
                            if (shouldAutoUpdate(autoUpdateLevel, updateType)) {
                                utilityService.showDownloadModal();
                                listenerService.fireEvent(listenerService.EventType.DOWNLOAD_UPDATE);
                            } else {
                                // Dont autoupdate, just notify the user
                                updateIsAvailable = true;
                            }
                        }

                        // Build update object.
                        let updateObject = {
                            gitName: gitName,
                            gitVersion: gitNewest.tag_name,
                            gitDate: gitDate,
                            gitLink: gitLink,
                            gitNotes: $sce.trustAsHtml(gitNotes),
                            gitZipDownloadUrl: gitZipDownloadUrl,
                            updateIsAvailable: updateIsAvailable,
                            updateIsMajorPrelease: updateIsMajorRelease
                        };

                        service.updateData = updateObject;

                        service.hasCheckedForUpdates = true;
                        service.isCheckingForUpdates = false;

                        resolve(updateObject);
                    }, (error) => {
                        service.isCheckingForUpdates = false;
                        logger.error(error);
                        resolve(false);
                    });
                });
            };

            service.downloadAndInstallUpdate = function() {
                if (service.updateIsAvailable()) {
                    utilityService.showDownloadModal();
                    listenerService.fireEvent(listenerService.EventType.DOWNLOAD_UPDATE);
                }
            };

            return service;
        });
}(window.angular));
