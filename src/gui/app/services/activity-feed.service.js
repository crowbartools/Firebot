"use strict";

(function() {

    const { marked } = require("marked");
    const { sanitize } = require("dompurify");

    angular
        .module("firebotApp")
        .factory("activityFeedService", function($sce, backendCommunicator, modalService, modalFactory,
            settingsService, ngToast) {
            const service = {};

            service.allActivities = [];
            service.activities = [];

            backendCommunicator.on("activity-feed:event-activity", (activity) => {

                activity.message = $sce.trustAsHtml(sanitize(marked.parseInline(activity.message)));

                service.allActivities.unshift(activity);
                if (service.allActivities.length > 500) {
                    service.allActivities.length = 500;
                }

                const allowedEvents = settingsService.getSetting("AllowedActivityEvents");
                if (!activity.event.forceAllow && !allowedEvents.includes(`${activity.source.id}:${activity.event.id}`)) {
                    return;
                }

                service.activities.unshift(activity);
                if (service.activities.length > 100) {
                    service.activities.length = 100;
                }
            });

            service.allAcknowledged = () => {
                if (service.activities.length < 1) {
                    return false;
                }
                return !service.activities.some(a => a.acknowledged === false);
            };

            service.markAllAcknowledged = () => {
                service.allActivities.forEach((a) => {
                    a.acknowledged = true;
                });
            };

            service.markAllNotAcknowledged = () => {
                service.allActivities.forEach((a) => {
                    a.acknowledged = false;
                });
            };

            service.toggleMarkAllAcknowledged = () => {
                if (service.allAcknowledged()) {
                    service.markAllNotAcknowledged();
                } else {
                    service.markAllAcknowledged();
                }
            };

            service.clearAllActivities = () => {
                modalFactory.showConfirmationModal({
                    title: "Clear All Activities",
                    question: "Are you sure you want to clear all activities?",
                    confirmLabel: "Clear",
                    confirmBtnType: "btn-danger"
                }).then((confirmed) => {
                    if (confirmed) {
                        service.allActivities = [];
                        service.activities = [];
                        ngToast.create({
                            className: 'success',
                            content: "Successfully cleared all activities!",
                            timeout: 5000
                        });
                    }
                });
            };

            service.unacknowledgedCount = () => {
                return service.activities.filter(a => !a.acknowledged).length;
            };

            backendCommunicator.on("activity-feed:acknowledge-all-activity", () => {
                service.markAllAcknowledged();
            });

            service.retriggerEvent = (activityId) => {
                backendCommunicator.send("activity-feed:retrigger-event", activityId);
                ngToast.create({
                    className: 'success',
                    content: "Successfully retriggered event!",
                    timeout: 5000
                });
            };

            service.showEditActivityFeedEventsModal = () => {
                modalService.showModal({
                    component: "editActivityEventsModal",
                    size: "md",
                    closeCallback: () => {
                        const allowedEvents = settingsService.getSetting("AllowedActivityEvents");
                        service.activities = service.allActivities
                            .filter(a => allowedEvents.includes(`${a.source.id}:${a.event.id}`));
                    }
                });
            };

            return service;
        });
}());