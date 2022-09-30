'use strict';

(function(angular) {

    //This handles updates
    const { getApplicableReleases } = require('../../shared/github-release-service');

    const moment = require("moment");

    angular
        .module('firebotApp')
        .factory('updatesService', function (logger, $q, $http, $sce, settingsService, utilityService, listenerService) {
            const service = {};

            const electron = require('electron');

            const APP_VERSION = electron.remote.app.getVersion();
            const isDev = !electron.remote.app.isPackaged;
            const isWindows = process.platform === "win32";

            const updatesDelayedAt = settingsService.getDelayedUpdateDateForVersion(APP_VERSION);
            const updatesAlreadyDelayed = updatesDelayedAt != null;
            const delayedTimeElapsed = updatesAlreadyDelayed ? moment().endOf().diff(moment(updatesDelayedAt).endOf("day"), "days") >= 7 : false;

            /** @type{import("../../../shared/github-release-service").GetApplicableReleasesResponse} */
            service.releases = {};

            service.isCheckingForUpdates = false;
            service.hasCheckedForUpdates = false;

            /** @type {import("../../../shared/github-release-service").FirebotRelease} */
            service.availableUpdate = null;

            service.updateDownloading = false;
            service.updateDownloaded = false;

            service.updateIsAvailable = function() {
                return service.availableUpdate != null;
            };

            function setAvailableUpdate(release) {
                service.availableUpdate = {
                    ...release,
                    patchNotes: $sce.trustAsHtml(release.patchNotes)
                };
            }

            function getUpdates() {
                return $q.when(getApplicableReleases(APP_VERSION));
            }

            service.checkForUpdate = function() {
                if (service.updateDownloading || service.updateDownloaded) {
                    return;
                }

                service.isCheckingForUpdates = true;

                getUpdates().then(releases => {
                    service.hasCheckedForUpdates = true;
                    service.isCheckingForUpdates = false;
                    service.releases = releases || {};

                    const canAutoUpdate = settingsService.getAutoUpdateLevel() > 0 && !isDev && isWindows;

                    if (service.releases.minorUpdate) {
                        setAvailableUpdate(service.releases.minorUpdate);
                        if (canAutoUpdate) {
                            if (updatesAlreadyDelayed) {
                                if (delayedTimeElapsed) {
                                    listenerService.fireEvent(listenerService.EventType.DOWNLOAD_UPDATE);
                                }
                            } else {
                                //ask user
                                //start week or start download
                            }
                        }
                    } else if (service.releases.patchUpdate) {
                        setAvailableUpdate(service.releases.patchUpdate);
                        if (canAutoUpdate) {
                            listenerService.fireEvent(listenerService.EventType.DOWNLOAD_UPDATE);
                        }
                    }

                    //$sce.trustAsHtml(gitNotes)
                });
            };

            service.downloadAndInstallUpdate = function() {
                if (service.updateIsAvailable()) {
                    listenerService.fireEvent(listenerService.EventType.DOWNLOAD_UPDATE);
                }
            };

            return service;
        });
}(window.angular));