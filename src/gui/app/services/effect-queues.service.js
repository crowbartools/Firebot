"use strict";

(function () {

    angular
        .module("firebotApp")
        .factory("effectQueuesService", function (backendCommunicator, utilityService,
            objectCopyHelper, ngToast) {
            const service = {};

            service.effectQueues = [];

            const updateEffectQueue = (effectQueue) => {
                const index = service.effectQueues.findIndex(eq => eq.id === effectQueue.id);
                if (index > -1) {
                    service.effectQueues[index] = effectQueue;
                } else {
                    service.effectQueues.push(effectQueue);
                }
            };

            service.loadEffectQueues = () => {
                const effectQueues = backendCommunicator.fireEventSync("effect-queues:get-effect-queues");
                if (effectQueues != null) {
                    service.effectQueues = effectQueues;
                }
            };

            backendCommunicator.on("all-queues", (effectQueues) => {
                if (effectQueues != null) {
                    service.effectQueues = effectQueues;
                }
            });

            backendCommunicator.on("updateQueueLength", (queue) => {
                const index = service.effectQueues.findIndex(eq => eq.id === queue.id);
                if (service.effectQueues[index] != null) {
                    service.effectQueues[index].length = queue.length;
                }
            });

            backendCommunicator.on("updateQueueStatus", (queue) => {
                const index = service.effectQueues.findIndex(eq => eq.id === queue.id);
                if (service.effectQueues[index] != null) {
                    service.effectQueues[index].active = queue.active;
                }
            });

            service.queueModes = [
                {
                    value: "auto",
                    label: "Sequential",
                    description: "Effect lists run one after another in order. Priority items are placed at the front of the queue.",
                    iconClass: "fa-sort-numeric-down"
                },
                {
                    value: "custom",
                    label: "Custom Delay",
                    description: "Each effect list defines how long the queue waits before triggering the next effect list.",
                    iconClass: "fa-clock"
                },
                {
                    value: "interval",
                    label: "Interval",
                    description: "Effect lists run at a fixed time interval.",
                    iconClass: "fa-stopwatch"
                },
                {
                    value: "manual",
                    label: "Manual",
                    description: "Effect lists only run when triggered by a Trigger Manual Queue effect.",
                    iconClass: "fa-step-forward"
                }
            ];

            service.getEffectQueues = () => {
                return service.effectQueues;
            };

            service.getEffectQueue = (id) => {
                return service.effectQueues.find(eq => eq.id === id);
            };

            service.saveEffectQueue = (effectQueue) => {
                const savedEffectQueue = backendCommunicator.fireEventSync("effect-queues:save-effect-queue", effectQueue);

                if (savedEffectQueue != null) {
                    updateEffectQueue(savedEffectQueue);

                    return true;
                }

                return false;
            };

            service.toggleEffectQueue = (queue) => {
                backendCommunicator.fireEvent("effect-queues:toggle-effect-queue", queue.id);
                queue.active = !queue.active;
            };

            service.clearEffectQueue = (queueId) => {
                backendCommunicator.fireEvent("effect-queues:clear-effect-queue", queueId);
            };

            service.saveAllEffectQueues = (effectQueues) => {
                service.effectQueues = effectQueues;
                backendCommunicator.fireEvent("effect-queues:save-all-effect-queues", effectQueues);
            };

            service.effectQueueNameExists = (name) => {
                return service.effectQueues.some(eq => eq.name === name);
            };

            service.duplicateEffectQueue = (effectQueueId) => {
                const effectQueue = service.effectQueues.find(eq => eq.id === effectQueueId);
                if (effectQueue == null) {
                    return;
                }

                const copiedEffectQueue = objectCopyHelper.copyObject("effect_queue", effectQueue);
                copiedEffectQueue.id = null;

                while (service.effectQueueNameExists(copiedEffectQueue.name)) {
                    copiedEffectQueue.name += " copy";
                }

                const successful = service.saveEffectQueue(copiedEffectQueue);
                if (successful) {
                    ngToast.create({
                        className: 'success',
                        content: 'Successfully duplicated an effect queue!'
                    });
                } else {
                    ngToast.create("Unable to duplicate effect queue.");
                }
            };

            service.deleteEffectQueue = (effectQueueId) => {
                service.effectQueues = service.effectQueues.filter(eq => eq.id !== effectQueueId);
                backendCommunicator.fireEvent("effect-queues:delete-effect-queue", effectQueueId);
            };

            service.showAddEditEffectQueueModal = (effectQueueId) => {
                return new Promise((resolve) => {
                    let effectQueue;

                    if (effectQueueId != null) {
                        effectQueue = service.getEffectQueue(effectQueueId);
                    }

                    utilityService.showModal({
                        component: "addOrEditEffectQueueModal",
                        size: "md",
                        resolveObj: {
                            effectQueue: () => effectQueue
                        },
                        closeCallback: (response) => {
                            resolve(response.effectQueue.id);
                        }
                    });
                });
            };

            service.showDeleteEffectQueueModal = (effectQueueId) => {
                return new Promise((resolve) => {
                    if (effectQueueId == null) {
                        resolve(false);
                    }

                    const queue = service.getEffectQueue(effectQueueId);
                    if (queue == null) {
                        resolve(false);
                    }

                    return utilityService
                        .showConfirmationModal({
                            title: "Delete Effect Queue",
                            question: `Are you sure you want to delete the effect queue "${queue.name}"?`,
                            confirmLabel: "Delete",
                            confirmBtnType: "btn-danger"
                        })
                        .then((confirmed) => {
                            if (confirmed) {
                                service.deleteEffectQueue(effectQueueId);
                            }

                            resolve(confirmed);
                        });
                });
            };

            return service;
        });
}());