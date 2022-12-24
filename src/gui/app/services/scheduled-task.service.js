"use strict";
(function() {
    angular
        .module("firebotApp")
        .factory("scheduledTaskService", function(backendCommunicator, $q, utilityService, objectCopyHelper, ngToast) {
            const service = {};

            service.scheduledTasks = [];

            function updateScheduledTask(scheduledTask) {
                const index = service.scheduledTasks.findIndex(t => t.id === scheduledTask.id);
                if (index > -1) {
                    service.scheduledTasks[index] = scheduledTask;
                } else {
                    service.scheduledTasks.push(scheduledTask);
                }
            }

            backendCommunicator.on("scheduledTaskUpdate", scheduledTask => {
                updateScheduledTask(scheduledTask);
            });

            backendCommunicator.on("allScheduledTasksUpdated", scheduledTasks => {
                service.scheduledTasks = scheduledTasks;
            });

            service.loadScheduledTasks = function() {
                $q.when(backendCommunicator.fireEventAsync("getScheduledTasks"))
                    .then(scheduledTasks => {
                        if (scheduledTasks) {
                            service.scheduledTasks = scheduledTasks;
                        }
                    });
            };

            service.getScheduledTasks = () => service.scheduledTasks;

            service.saveScheduledTask = function(scheduledTask) {
                return $q.when(backendCommunicator.fireEventAsync("saveScheduledTask", scheduledTask))
                    .then(savedScheduledTask => {
                        if (savedScheduledTask) {
                            updateScheduledTask(savedScheduledTask);
                            return true;
                        }
                        return false;
                    });
            };

            service.saveAllScheduledTasks = function(scheduledTasks) {
                service.scheduledTasks = scheduledTasks;
                backendCommunicator.fireEventAsync("saveAllScheduledTasks", scheduledTasks);
            };

            service.toggleScheduledTaskEnabledState = function(scheduledTask) {
                if (scheduledTask == null) {
                    return;
                }

                scheduledTask.enabled = !scheduledTask.enabled;
                service.saveScheduledTask(scheduledTask);
            };

            service.scheduledTaskNameExists = (name) => {
                return service.scheduledTasks.some(t => t.name === name);
            };

            service.duplicateScheduledTask = (scheduledTaskId) => {
                const scheduledTask = service.scheduledTasks.find(t => t.id === scheduledTaskId);
                if (scheduledTask == null) {
                    return;
                }
                const copiedScheduledTask = objectCopyHelper.copyObject("scheduled_task", scheduledTask);
                copiedScheduledTask.id = null;

                while (service.scheduledTaskNameExists(copiedScheduledTask.name)) {
                    copiedScheduledTask.name += " copy";
                }

                service.saveScheduledTask(copiedScheduledTask).then(successful => {
                    if (successful) {
                        ngToast.create({
                            className: 'success',
                            content: 'Successfully duplicated a scheduled task!'
                        });
                    } else {
                        ngToast.create("Unable to duplicate scheduled task.");
                    }
                });
            };

            // Deletes a scheduled task.
            service.deleteScheduledTask = function(scheduledTask) {
                if (scheduledTask == null) {
                    return;
                }

                service.scheduledTasks = service.scheduledTasks.filter(t => t.id !== scheduledTask.id);

                backendCommunicator.fireEvent("deleteScheduledTask", scheduledTask.id);
            };

            service.showAddEditScheduledTaskModal = function(scheduledTask) {
                return new Promise(resolve => {
                    utilityService.showModal({
                        component: "addOrEditScheduledTaskModal",
                        size: "md",
                        resolveObj: {
                            scheduledTask: () => scheduledTask
                        },
                        closeCallback: response => {
                            resolve(response.scheduledTask);
                        }
                    });
                });
            };

            service.getFriendlyCronSchedule = function(schedule) {
                const cronstrue = require("cronstrue");
                const { CronTime } = require("cron");
                try {
                    // First make sure cron likes it since it's more strict
                    new CronTime(schedule);
                    return cronstrue.toString(schedule);
                } catch (error) {
                    return "Invalid schedule";
                }
            };

            return service;
        });
}());
