"use strict";

(function() {
    angular.module("firebotApp").component("addOrEditScheduledTaskModal", {
        template: `
            <context-menu-modal-header
                on-close="$ctrl.dismiss()"
                trigger-type="scheduled task"
                trigger-name="$ctrl.scheduledTask.name"
                sort-tags="$ctrl.scheduledTask.sortTags"
                show-trigger-name="true"
            ></context-menu-modal-header>
            <div class="modal-body">
                <div class="general-button-settings">
                    <div class="settings-title">
                        <h3>General Settings</h3>
                    </div>
                    <div class="input-group pb-6 settings-commandGroup-groupName">
                        <span class="input-group-addon">Name</span>
                        <input type="text" class="form-control" ng-model="$ctrl.scheduledTask.name">
                    </div>
                    <div class="input-group pb-2 settings-commandGroup-scheduledTask">
                        <span class="input-group-addon">Schedule <tooltip text="'Schedule must be entered in crontab format.'"></tooltip></span>
                        <input type="text" class="form-control" ng-model="$ctrl.scheduledTask.schedule" ng-change="$ctrl.updateFriendlyCronSchedule()">
                    </div>
                    <div class="muted pb-6">{{$ctrl.scheduleFriendlyName}}</div>
                    <div class="controls-fb-inline">
                        <label class="control-fb control--checkbox" ng-hide="$ctrl.isNewScheduledTask">Enabled
                            <input type="checkbox" ng-model="$ctrl.scheduledTask.enabled" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>
                        <label class="control-fb control--checkbox">Only Run When Live <tooltip text="'Uncheck this if you want this scheduled task to run effects even when you are not live.'"></tooltip>
                            <input type="checkbox" ng-model="$ctrl.scheduledTask.onlyWhenLive" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                </div>

                <div class="function-button-settings" style="margin-top: 15px;">
                    <effect-list header="What should this scheduled task do?" effects="$ctrl.scheduledTask.effects" trigger="scheduledTask" trigger-meta="$ctrl.triggerMeta" update="$ctrl.effectListUpdated(effects)" modalId="{{$ctrl.modalId}}"></effect-list>
                </div>
                <p class="muted" style="font-size:11px;margin-top:6px;">
                    <b>ProTip:</b> If you want to have this scheduled task display a single chat message at a time, try the <b>Run Random Effect</b> or <b>Run Sequential Effect</b>
                </p>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
        `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function($scope, utilityService, ngToast, scheduledTaskService) {
            const $ctrl = this;

            $ctrl.scheduledTask = {
                enabled: true,
                onlyWhenLive: true,
                name: "",
                schedule: "0 * * * *",
                sortTags: []
            };

            $ctrl.scheduleFriendlyName = "";
            $ctrl.parsedSchedule = {};

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.scheduledTask == null) {
                    $ctrl.isNewScheduledTask = true;
                } else {
                    $ctrl.scheduledTask = JSON.parse(JSON.stringify($ctrl.resolve.scheduledTask));
                }

                $ctrl.updateFriendlyCronSchedule();
                $ctrl.updateParsedSchedule();

                const modalId = $ctrl.resolve.modalId;
                $ctrl.modalId = modalId;
                utilityService.addSlidingModal(
                    $ctrl.modalInstance.rendered.then(() => {
                        const modalElement = $("." + modalId).children();
                        return {
                            element: modalElement,
                            name: "Edit Scheduled Task",
                            id: modalId,
                            instance: $ctrl.modalInstance
                        };
                    })
                );

                $scope.$on("modal.closing", function() {
                    utilityService.removeSlidingModal();
                });
            };

            $ctrl.effectListUpdated = function(effects) {
                $ctrl.scheduledTask.effects = effects;
            };

            function isScheduleValid() {
                const { CronTime } = require("cron");
                try {
                    const crontime = new CronTime($ctrl.scheduledTask.schedule);
                    if (crontime == null) {
                        return false;
                    }
                } catch (error) {
                    return false;
                }

                return true;
            }

            function scheduledTaskValid() {
                if ($ctrl.scheduledTask.name === "") {
                    ngToast.create("Please provide a name for the Scheduled Task.");
                    return false;
                } else if ($ctrl.scheduledTask.schedule.length < 1 || isScheduleValid($ctrl.scheduledTask.schedule) !== true) {
                    ngToast.create("Please enter a valid cron schedule for the Scheduled Task.");
                    return false;
                }
                return true;
            }

            $ctrl.updateFriendlyCronSchedule = function() {
                $ctrl.scheduleFriendlyName = scheduledTaskService.getFriendlyCronSchedule($ctrl.scheduledTask.schedule);
            };

            $ctrl.updateParsedSchedule = function() {
                $ctrl.parsedSchedule = scheduledTaskService.parseSchedule($ctrl.scheduledTask.schedule);
            };

            $ctrl.save = function() {
                if (!scheduledTaskValid()) {
                    return;
                }

                scheduledTaskService.saveScheduledTask($ctrl.scheduledTask).then(successful => {
                    if (successful) {
                        $ctrl.close({
                            $value: {
                                scheduledTask: $ctrl.scheduledTask
                            }
                        });
                    } else {
                        ngToast.create("Failed to save scheduled Task. Please try again or view logs for details.");
                    }
                });
            };
        }
    });
}());
