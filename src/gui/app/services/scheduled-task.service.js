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

            function parseSchedulePart(part) {
                const setValueRegex = /^\d+$/g;
                const stepRegex = /^\*\/\d+$/g;
                const rangeRegex = /^\d+-\d+$/g;
                const setRegex = /^\d+(,\d+)*$/g;

                if (part === "*") {
                    return {
                        type: "all"
                    };
                } else if (setValueRegex.test(part)) {
                    return {
                        type: "setValue",
                        value: part
                    };
                } else if (stepRegex.test(part)) {
                    return {
                        type: "step",
                        interval: part.split("/")[1]
                    };
                } else if (rangeRegex.test(part)) {
                    const subparts = part.split("-");

                    return {
                        type: "range",
                        start: subparts[0],
                        end: subparts[1]
                    };
                } else if (setRegex.test(part)) {
                    return {
                        type: "set",
                        items: part.split(",")
                    };
                }

                return {
                    type: "advanced",
                    value: part
                };
            }

            service.parseSchedule = (schedule) => {
                const rawParts = schedule.split(" ");
                if (rawParts.length === 6) {
                    return {
                        secondPart: parseSchedulePart(rawParts[0]),
                        minutePart: parseSchedulePart(rawParts[1]),
                        hourPart: parseSchedulePart(rawParts[2]),
                        datePart: parseSchedulePart(rawParts[3]),
                        monthPart: parseSchedulePart(rawParts[4]),
                        dayOfWeekPart: parseSchedulePart(rawParts[5])
                    };
                } else if (rawParts.length === 5) {
                    return {
                        minutePart: parseSchedulePart(rawParts[0]),
                        hourPart: parseSchedulePart(rawParts[1]),
                        datePart: parseSchedulePart(rawParts[2]),
                        monthPart: parseSchedulePart(rawParts[3]),
                        dayOfWeekPart: parseSchedulePart(rawParts[4])
                    };
                }

                return null;
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
                            content: 'Successfully duplicated scheduled effect list!'
                        });
                    } else {
                        ngToast.create("Unable to duplicate scheduled effect list.");
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
                        breadcrumbName: "Edit Scheduled Effect List",
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
