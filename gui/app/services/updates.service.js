'use strict';

(function(angular) {

    //This handles updates
    const VersionCompare = require('../../shared/compare-versions');
    const UpdateType = VersionCompare.UpdateType;
    const marked = require("marked");

    const { sanitize } = require("dompurify");

    angular
        .module('firebotApp')
        .factory('updatesService', function (logger, $q, $http, $sce, settingsService, utilityService, listenerService) {
            // factory/service object
            const service = {};

            const FIREBOT_RELEASES_URL = "https://api.github.com/repos/crowbartools/Firebot/releases";

            const APP_VERSION = require('electron').remote.app.getVersion();

            service.updateData = null;

            service.isCheckingForUpdates = false;

            service.hasCheckedForUpdates = false;

            service.hasReleaseData = false;

            service.updateIsAvailable = function() {
                return service.hasCheckedForUpdates ? ((service.updateData && service.updateData.updateIsAvailable) || service.majorUpdate != null) : false;
            };

            function shouldAutoUpdate(autoUpdateLevel, updateType) {
                // if auto updating is completely disabled
                if (autoUpdateLevel === 0) {
                    return false;
                }

                // check each update type
                switch (updateType) {
                case UpdateType.OFFICIAL:
                case UpdateType.PATCH:
                case UpdateType.MINOR:
                    return autoUpdateLevel >= 1;
                case UpdateType.PRERELEASE:
                case UpdateType.NONE:
                case UpdateType.MAJOR:
                case UpdateType.MAJOR_PRERELEASE:
                default:
                    return false;
                }
            }

            // Update Checker
            // This checks for updates.
            service.checkForUpdate = function() {
                return $q(async (resolve) => {

                    service.isCheckingForUpdates = true;

                    try {
                        const response = await $http.get(FIREBOT_RELEASES_URL);
                        // Get app version


                        const releases = response.data;

                        let latestRelease = null;
                        let latestUpdateType = null;
                        let foundMajorRelease = false;
                        for (let release of releases) {
                            // Now lets look to see if there is a newer version.
                            const updateType = VersionCompare.compareVersions(release.tag_name, APP_VERSION);

                            if (!foundMajorRelease && (updateType === UpdateType.MAJOR || updateType === UpdateType.MAJOR_PRERELEASE)) {
                                foundMajorRelease = true;
                                if (settingsService.notifyOnBeta()) {
                                    service.majorUpdate = {
                                        gitName: release.name,
                                        gitVersion: release.tag_name,
                                        gitLink: release.html_url
                                    };
                                }
                            } else if (updateType === UpdateType.OFFICIAL ||
                                updateType === UpdateType.PATCH ||
                                updateType === UpdateType.MINOR ||
                                updateType === UpdateType.NONE ||
                                (updateType === UpdateType.PRERELEASE && settingsService.notifyOnBeta())) {
                                latestRelease = release;
                                latestUpdateType = updateType;
                                break;
                            }
                        }

                        // Parse github api to get tag name.
                        const gitNewest = latestRelease;

                        if (gitNewest != null) {
                            let gitName = gitNewest.name;
                            let gitDate = gitNewest.published_at;
                            let gitLink = gitNewest.html_url;
                            let gitNotes = sanitize(marked(gitNewest.body));
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

                            service.updateData = {
                                gitName: gitName,
                                gitVersion: gitNewest.tag_name,
                                gitDate: gitDate,
                                gitLink: gitLink,
                                gitNotes: $sce.trustAsHtml(gitNotes),
                                gitZipDownloadUrl: gitZipDownloadUrl,
                                updateIsAvailable: updateIsAvailable
                            };
                        }

                        service.hasCheckedForUpdates = true;
                        service.isCheckingForUpdates = false;

                        resolve();
                    } catch (error) {
                        service.hasCheckedForUpdates = true;
                        service.isCheckingForUpdates = false;
                        logger.error(error);
                        resolve(false);
                    }
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