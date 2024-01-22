"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("notificationService", function(backendCommunicator) {
            const service = {};
            let notificationCache = [];

            const NotificationType = {
                UPDATE: "update",
                INFO: "info",
                TIP: "tip",
                ALERT: "alert"
            };

            service.NotificationType = NotificationType;

            service.getNotifications = function() {
                return notificationCache;
            };

            service.getUnreadCount = function() {
                return notificationCache.filter(n => !n.read).length;
            };

            service.markNotificationAsRead = (id) => {
                backendCommunicator.send("mark-notification-as-read", id);
            };

            service.deleteNotification = (id) => {
                backendCommunicator.send("delete-notification", id);
            };

            service.loadAllNotifications = () => {
                notificationCache = backendCommunicator.fireEventSync("get-all-notifications") ?? [];
            };

            backendCommunicator.on("new-notification", (notification) => {
                notificationCache.push(notification);
            });

            backendCommunicator.on("notification-marked-as-read", (id) => {
                const notification = notificationCache.find(n => n.id === id);
                if (notification != null) {
                    notification.read = true;
                }
            });

            backendCommunicator.on("notification-deleted", (id) => {
                notificationCache = notificationCache.filter(n => n.id !== id);
            });

            return service;
        });
}());
