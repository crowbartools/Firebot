"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("effectQueuesService", function(logger, backendCommunicator, utilityService) {
            let service = {};

            let effectQueues = {};

            service.loadEffectQueues = async function() {
                let queues = await backendCommunicator.fireEventAsync("getEffectQueues");
                if (queues != null) {
                    effectQueues = queues;
                }
            };
            service.loadEffectQueues();

            service.queueModes = [
                {
                    id: "custom",
                    display: "Custom",
                    description: "Define the duration to wait per effect list.",
                    iconClass: "fa-clock"
                },
                {
                    id: "auto",
                    display: "Wait",
                    description: "Waits for effects to finish. Requires a 'Delay Effect' to be present to have any effect.",
                    iconClass: "fa-hourglass-half"
                },
                {
                    id: "interval",
                    display: "Interval",
                    description: "Runs effect lists on a set interval.",
                    iconClass: "fa-stopwatch"
                }
            ];

            service.getEffectQueues = function() {
                return Object.values(effectQueues);
            };

            service.getEffectQueue = function(id) {
                return effectQueues[id];
            };

            service.saveEffectQueue = function(queue) {
                if (!queue) return;
                effectQueues[queue.id] = queue;
                backendCommunicator.fireEvent("saveEffectQueue", queue);
            };

            service.deleteEffectQueue = function(queueId) {
                if (!queueId) return;
                delete effectQueues[queueId];
                backendCommunicator.fireEvent("deleteEffectQueue", queueId);
            };

            service.showAddEditEffectQueueModal = function(queueId) {
                return new Promise(resolve => {
                    let queue;
                    if (queueId != null) {
                        queue = service.getEffectQueue(queueId);
                    }

                    utilityService.showModal({
                        component: "addOrEditEffectQueueModal",
                        size: "sm",
                        resolveObj: {
                            queue: () => queue
                        },
                        closeCallback: resp => {
                            let { effectQueue } = resp;

                            service.saveEffectQueue(effectQueue);

                            resolve(effectQueue.id);
                        }
                    });
                });
            };

            service.showDeleteEffectQueueModal = function(queueId) {
                if (queueId == null) return Promise.resolve(false);

                const queue = service.getEffectQueue(queueId);
                if (queue == null) return Promise.resolve(false);

                return utilityService
                    .showConfirmationModal({
                        title: "Delete Effect Queue",
                        question: `Are you sure you want to delete the effect queue "${queue.name}"?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then(confirmed => {
                        if (confirmed) {
                            service.deleteEffectQueue(queueId);
                        }
                        return confirmed;
                    });
            };

            return service;
        });
}());