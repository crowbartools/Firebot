"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("timersController", function(
            $scope,
            timerService,
            utilityService,
        ) {
            // Cache commands on app load.
            timerService.refreshTimers();

            $scope.timerService = timerService;

            /*
      * TIMERS
      */
            $scope.toggleTimerActiveState = timer => {
                if (timer == null) return;
                timer.active = !timer.active;
                timerService.saveTimer(timer);
                timerService.refreshTimers();
            };

            $scope.deleteTimer = timer => {
                timerService.deleteTimer(timer);
                timerService.refreshTimers();
            };

            $scope.openAddOrEditTimerModal = function(timer) {
                utilityService.showModal({
                    component: "addOrEditTimerModal",
                    resolveObj: {
                        timer: () => timer
                    },
                    closeCallback: resp => {
                        let action = resp.action,
                            timer = resp.timer;

                        switch (action) {
                        case "add":
                        case "update":
                            timerService.saveTimer(timer);
                            break;
                        case "delete":
                            timerService.deleteTimer(timer);
                            break;
                        }

                        // Refresh timers
                        timerService.refreshTimers();
                    }
                });
            };

            $scope.timerMenuOptions = [
                {
                    html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                    click: function ($itemScope) {
                        let timer = $itemScope.timer;
                        $scope.openAddOrEditTimerModal(timer);
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
                    html: `<a href style="color:red"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                    click: function ($itemScope) {
                        let timer = $itemScope.timer;
                        $scope.deleteTimer(timer);
                    }
                }
            ];
        });
}());
