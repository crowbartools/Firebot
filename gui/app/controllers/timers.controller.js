"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("timersController", function(
            $scope,
            timerService,
            utilityService,
            objectCopyHelper
        ) {

            $scope.timerService = timerService;

            /*
            * TIMERS
            */
            $scope.toggleTimerActiveState = timer => {
                if (timer == null) return;
                timer.active = !timer.active;
                timerService.saveTimer(timer);
            };

            $scope.duplicateTimer = timer => {
                let copiedTimer = objectCopyHelper.copyObject("timer", timer);
                copiedTimer.name += " copy";
                timerService.saveTimer(copiedTimer);
            };

            $scope.onTimersUpdated = (timers) => {
                timerService.saveAllTimers(timers);
            };

            $scope.headers = [
                {
                    name: "NAME",
                    icon: "fa-user",
                    cellTemplate: `{{data.name}}`,
                    cellController: () => {}
                },
                {
                    name: "INTERVAL",
                    icon: "fa-stopwatch",
                    cellTemplate: `{{data.interval}}`,
                    cellController: () => {}
                },
                {
                    name: "EFFECTS",
                    icon: "fa-magic",
                    cellTemplate: `{{data.effects ? data.effects.list.length : 0}}`,
                    cellControler: () => {}
                }
            ];

            $scope.timerOptions = (item) => {
                const options = [
                    {
                        html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                        click: function () {
                            $scope.openAddOrEditTimerModal(item);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-toggle-off" style="margin-right: 10px;"></i> Toggle Enabled</a>`,
                        click: function ($itemScope) {
                            let timer = $itemScope.timer;
                            $scope.toggleTimerActiveState(timer);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: function () {
                            $scope.duplicateTimer(item);
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: function () {
                            utilityService
                                .showConfirmationModal({
                                    title: "Delete Timer",
                                    question: `Are you sure you want to delete the Timer "${item.name}"?`,
                                    confirmLabel: "Delete",
                                    confirmBtnType: "btn-danger"
                                })
                                .then(confirmed => {
                                    if (confirmed) {
                                        timerService.deleteTimer(item);
                                    }
                                });

                        }
                    }
                ];

                return options;
            };
        });
}());
