"use strict";
(function() {
  angular
    .module("firebotApp")
    .controller("timersController", function(
      $scope,
      timerService,
      updatesService,
      utilityService,
      settingsService,
      groupsService,
      effectHelperService,
      listenerService
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

            console.log("saving timer", timer);

            // Refresh timers
            timerService.refreshTimers();
          }
        });
      };
    });
})();
