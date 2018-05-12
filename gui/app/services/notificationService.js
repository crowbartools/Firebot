'use strict';

(function() {

    // This provides methods for notifications

    const dataAccess = require('../../lib/common/data-access.js');

    angular
        .module('firebotApp')
        .factory('notificationService', function ($http, $interval, logger) {

            let service = {};
            let notifications = [];

            const NotificationType = {
                EXTERNAL: "external",
                INTERNAL: "internal"
            };

            const NotificationIconType = {
                UPDATE: "update",
                INFO: "info",
                TIP: "tip",
                ALERT: "alert"
            };
            /* Helpers */
            function getNotificationsFile() {
                return dataAccess.getJsonDbInUserData("/user-settings/notifications");
            }

            function deleteDataFromFile(path) {
                try {
                    getNotificationsFile().delete(path);
                } catch (err) {} //eslint-disable-line no-empty
            }
            function getDataFromFile(path) {
                let data = null;
                try {
                    data = getNotificationsFile().getData(path, true);
                } catch (err) {} //eslint-disable-line no-empty
                return data;
            }
            function getSavedNotifications() {
                let saveNotis = getDataFromFile("/notifications");
                return saveNotis ? saveNotis : [];
            }
            function pushDataToFile(path, data) {
                try {
                    getNotificationsFile().push(path, data, true);
                } catch (err) {} //eslint-disable-line no-empty
            }

            function pushSavedNotification(notification) {
                pushDataToFile("/notifications[]", notification);
            }

            function updateSavedNotificationAtIndex(notification, index) {
                pushDataToFile(`/notifications[${index}]`, notification);
            }

            function deleteSavedNotificationAtIndex(index) {
                deleteDataFromFile(`/notifications[${index}]`);
            }

            function getKnownExternalNotifications() {
                let externalNotiIds = getDataFromFile("/knownExternalIds");
                return externalNotiIds ? externalNotiIds : [];
            }

            function setKnownExternalNotifications(notis) {
                pushDataToFile("/knownExternalIds", notis);
            }

            function getIndexOfUuid(uuid) {
                let foundIndex = null;

                for (let i = 0; i < notifications.length; i++) {
                    let n = notifications[i];
                    if (n.uuid === uuid) {
                        foundIndex = i;
                        break;
                    }
                }

                return foundIndex;
            }

            function uuid() {
                return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                );
            }

            function loadSavedNotifications() {
                notifications = getSavedNotifications();
            }

            function loadExternalNotifications() {
                $http.get("https://raw.githubusercontent.com/Firebottle/Firebot/master/resources/notifications.json")
                    .then((response) => {
                        let externalNotifications = response.data;

                        let knownExtNotis = getKnownExternalNotifications();

                        let newKnownExtNotis = [];

                        if (externalNotifications != null) {
                            externalNotifications.forEach((n) => {

                                newKnownExtNotis.push(n.id);

                                if (!knownExtNotis.includes(n.id)) {

                                    n.type = NotificationType.EXTERNAL;
                                    n.externalId = n.id;
                                    n.id = undefined;

                                    service.addNotification(n, true);

                                }
                            }, (err) => {
                                logger.error(err);
                            });

                            setKnownExternalNotifications(newKnownExtNotis);
                        }
                    });
            }

            function mixerStatusNotification() {
                // This will check the mixer status page every once in awhile to see if there is it is having issues.
                $http.get("https://00qbcbkrqn0y.statuspage.io/api/v2/status.json")
                    .then((response) => {
                        let data = response.data,
                            statusIndicator = data.status.indicator,
                            statusText = data.status.description,
                            notification = {
                                "id": "MixerStatus",
                                "title": "Mixer Issue",
                                "message": "Mixer is reporting:<br>" + statusText + ". <br><br> This could cause issues with Firebot. Please be patient as they address the issues.",
                                "icon": "alert"
                            };

                        if (statusIndicator !== "none") {
                            service.addNotification(notification, false);
                        } else {
                            service.deleteNotification(notification);
                        }
                    });
            }

            service.NotificationIconType = NotificationIconType;
            service.NotificationType = NotificationType;

            service.getNotifications = function() {
                return notifications;
            };

            service.getUnreadCount = function() {
                return notifications.filter((n) => !n.read).length;
            };

            service.markNotificationAsRead = function(notification) {
                notification.read = true;

                if (notification.saved) {
                    let index = getIndexOfUuid(notification.uuid);
                    if (index != null) {
                        updateSavedNotificationAtIndex(notification, index);
                    }
                }
            };

            service.deleteNotification = function(notification) {

                if (notification.saved) {
                    let index = getIndexOfUuid(notification.uuid);
                    if (index != null) {
                        deleteSavedNotificationAtIndex(index);
                    }
                }

                notifications = notifications.filter(n => n.uuid !== notification.uuid);
            };

            service.addNotification = function(notification, permenantlySave = false) {
                notification.uuid = uuid();
                notification.timestamp = new Date();
                notification.read = false;

                notification.type = notification.type ? notification.type : NotificationType.INTERNAL;
                notification.icon = notification.icon ? notification.icon : NotificationIconType.INFO;

                if (permenantlySave) {
                    notification.saved = true;
                    pushSavedNotification(notification);
                }

                notifications.push(notification);
            };

            service.loadAllNotifications = function() {
                notifications = [];
                loadSavedNotifications();
                loadExternalNotifications();
                mixerStatusNotification();
            };

            let externalIntervalCheck = null;
            service.startExternalIntervalCheck = function() {
                //check for new external notifications every 5 minutes
                if (externalIntervalCheck != null) {
                    $interval.cancel(externalIntervalCheck);
                }

                externalIntervalCheck = $interval(() => {
                    loadExternalNotifications();
                    mixerStatusNotification();
                }, 5 * 60000);
            };

            return service;
        });
}());
