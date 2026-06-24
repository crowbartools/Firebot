"use strict";

(function() {

    const { marked } = require("marked");
    const { sanitize } = require("dompurify");

    angular
        .module("firebotApp")
        .factory("activityFeedService", function(
            $sce,
            backendCommunicator,
            modalService,
            modalFactory,
            settingsService,
            ngToast
        ) {
            const service = {};

            service.allActivities = [];
            service.filteredActivities = [];

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

                service.filteredActivities.unshift(activity);

                if (service.filteredActivities.length > 100) {
                    service.filteredActivities.length = 100;
                }
            });

            service.toggleActivityAcknowledged = (activityId) => {
                backendCommunicator.send("activity-feed:toggle-activity-acknowledged", activityId);
            };

            service.allAcknowledged = () => {
                if (service.filteredActivities.length < 1) {
                    return false;
                }
                return !service.filteredActivities.some(a => a.acknowledged === false);
            };

            service.toggleMarkAllAcknowledged = () => {
                backendCommunicator.send("activity-feed:toggle-acknowledged-for-all");
            };

            service.clearAllActivities = () => {
                modalFactory.showConfirmationModal({
                    title: "Clear All Activities",
                    question: "Are you sure you want to clear all activities?",
                    confirmLabel: "Clear",
                    confirmBtnType: "btn-danger"
                }).then(async (confirmed) => {
                    if (confirmed) {
                        backendCommunicator.send("activity-feed:clear-all-activities");
                        ngToast.create({
                            className: 'success',
                            content: "Successfully cleared all activities!",
                            timeout: 5000
                        });
                    }
                });
            };

            service.unacknowledgedCount = () => {
                return service.filteredActivities.filter(a => !a.acknowledged).length;
            };

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
                        service.filteredActivities = service.allActivities
                            .filter(a => allowedEvents.includes(`${a.source.id}:${a.event.id}`));
                    }
                });
            };

            backendCommunicator.on("activity-feed:activity-updated", (activity) => {
                activity.message = $sce.trustAsHtml(sanitize(marked.parseInline(activity.message)));
                const existingActivity = service.allActivities.findIndex(a => a.id === activity.id);

                if (existingActivity > -1) {
                    service.allActivities.splice(existingActivity, 1, activity);
                }

                const existingFilteredActivity = service.filteredActivities.findIndex(a => a.id === activity.id);

                if (existingFilteredActivity > -1) {
                    service.filteredActivities.splice(existingFilteredActivity, 1, activity);
                }
            });

            backendCommunicator.on("activity-feed:all-items", (items) => {
                service.allActivities = items ?? [];
                service.allActivities.forEach((a) => {
                    a.message = $sce.trustAsHtml(sanitize(marked.parseInline(a.message)));
                });

                const allowedEvents = settingsService.getSetting("AllowedActivityEvents");
                service.filteredActivities = service.allActivities
                    .filter(a => allowedEvents.includes(`${a.source.id}:${a.event.id}`));
            });

            backendCommunicator.send("activity-feed:ui-service-ready");

            return service;
        });
}());