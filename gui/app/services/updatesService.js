'use strict';

(function(angular) {

    //This handles updates
    const VersionCompare = require('../../shared/compare-versions');
    const UpdateType = VersionCompare.UpdateType;
    const marked = require("marked");

    angular
        .module('firebotApp')
        .factory('updatesService', function (logger, $q, $http, $sce, settingsService, utilityService, listenerService) {
            // factory/service object
            let service = {};

            service.updateData = null;

            service.isCheckingForUpdates = false;

            service.hasCheckedForUpdates = false;

            service.hasReleaseData = false;

            service.updateIsAvailable = function() {
                return service.hasCheckedForUpdates ? ((service.updateData && service.updateData.updateIsAvailable) || service.majorUpdate != null) : false;
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
                    case UpdateType.OFFICIAL:
                    case UpdateType.PATCH:
                    case UpdateType.MINOR:
                        return autoUpdateLevel >= 1;
                    case UpdateType.NONE:
                    case UpdateType.MAJOR:
                    case UpdateType.MAJOR_PRERELEASE:
                    default:
                        return false;
                    }
                }

                return $q((resolve) => {

                    let firebotReleasesUrl = "https://api.github.com/repos/Firebottle/Firebot/releases";

                    $http.get(firebotReleasesUrl).then((response) => {
                        // Get app version
                        let currentVersion = require('electron').remote.app.getVersion();

                        const releases = response.data;

                        let latestRelease = null;
                        let latestUpdateType = null;
                        let majorRelease = null;
                        for (let release of releases) {
                            // Now lets look to see if there is a newer version.
                            let updateType = VersionCompare.compareVersions(release.tag_name, currentVersion);

                            if (majorRelease == null && (updateType === UpdateType.MAJOR || updateType === UpdateType.MAJOR_PRERELEASE)) {
                                majorRelease = release;

                                if (settingsService.notifyOnBeta()) {
                                    service.majorUpdate = {
                                        gitName: release.name,
                                        gitVersion: release.tag_name,
                                        gitLink: release.html_url
                                    };
                                }

                            } else if (updateType === UpdateType.PRERELEASE ||
                                updateType === UpdateType.OFFICIAL ||
                                updateType === UpdateType.PATCH ||
                                updateType === UpdateType.MINOR ||
                                updateType === UpdateType.NONE) {
                                latestRelease = release;
                                latestUpdateType = updateType;
                                break;
                            }
                        }

                        // Parse github api to get tag name.
                        let gitNewest = latestRelease;

                        if (gitNewest != null) {
                            let gitName = gitNewest.name;
                            let gitDate = gitNewest.published_at;
                            let gitLink = gitNewest.html_url;
                            let gitNotes = marked(gitNewest.body);
                            let gitZipDownloadUrl = gitNewest.assets[0].browser_download_url;

                            // Now lets look to see if there is a newer version.

                            let updateIsAvailable = false;
                            if (latestUpdateType !== UpdateType.NONE) {
                                let autoUpdateLevel = settingsService.getAutoUpdateLevel();

                                // Check if we should auto update based on the users setting
                                if (shouldAutoUpdate(autoUpdateLevel, latestUpdateType)) {
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
                                updateIsAvailable: updateIsAvailable
                            };

                            service.updateData = updateObject;
                        }

                        service.hasCheckedForUpdates = true;
                        service.isCheckingForUpdates = false;

                        resolve();
                    }, (error) => {
                        service.hasCheckedForUpdates = true;
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