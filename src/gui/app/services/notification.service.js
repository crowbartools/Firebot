"use strict";

(function() {


    angular
        .module("firebotApp")
        .factory("notificationService", function(backendCommunicator, ngToast) {
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
                backendCommunicator.send("notifications:mark-notification-as-read", id);
            };

            service.deleteNotification = (id) => {
                backendCommunicator.send("notifications:delete-notification", id);
            };

            service.loadAllNotifications = () => {
                notificationCache = backendCommunicator.fireEventSync("notifications:get-all-notifications") ?? [];
            };

            service.getIconClass = (type) => {
                let iconClass = "";
                switch (type) {
                    case NotificationType.UPDATE:
                        iconClass = "download";
                        break;
                    case NotificationType.ALERT:
                        iconClass = "exclamation-circle";
                        break;
                    case NotificationType.TIP:
                        iconClass = "question-circle";
                        break;
                    case NotificationType.INFO:
                    default:
                        iconClass = "info-circle";
                }
                return `fa-${iconClass}`;
            };

            backendCommunicator.on("notifications:new-notification", (notification) => {
                notificationCache.push(notification);
                let toastClass;

                switch (notification.type) {
                    case NotificationType.ALERT:
                        toastClass = "danger";
                        break;

                    case NotificationType.UPDATE:
                        toastClass = "warning";
                        break;

                    case NotificationType.TIP:
                        toastClass = "success";
                        break;

                    case NotificationType.INFO:
                    default:
                        toastClass = "info";
                }

                const content = `<div class="rich-toast">
                    ${notification.title?.length ? `<div class="rich-toast-header">${notification.title}</div>` : ``}
                    <div class="rich-toast-body">
                        <div class="modal-icon"><i class="fad ${service.getIconClass(notification.type)}" aria-hidden="true"></i></div>
                        <div class="rich-toast-body-content">${notification.message}</div>
                    </div>
                </div>`;

                ngToast.create({
                    className: toastClass,
                    content: content,
                    dismissOnTimeout: false,
                    dismissOnClick: false,
                    dismissButton: true
                });
            });

            backendCommunicator.on("notifications:notification-marked-as-read", (id) => {
                const notification = notificationCache.find(n => n.id === id);
                if (notification != null) {
                    notification.read = true;
                }
            });

            backendCommunicator.on("notifications:notification-deleted", (id) => {
                notificationCache = notificationCache.filter(n => n.id !== id);
            });

            backendCommunicator.send("notifications:start-external-notification-check");

            return service;
        });
}());