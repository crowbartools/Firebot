"use strict";

// Modal for adding or editting a command

(function() {
  angular.module("firebotApp").component("addOrEditTimerModal", {
    templateUrl:
      "./directives/modals/commands/addOrEditTimer/addOrEditTimerModal.html",
    bindings: {
      resolve: "<",
      close: "&",
      dismiss: "&"
    },
    controller: function($scope, commandsService) {
      let $ctrl = this;

      $ctrl.timer = {
        active: true,
        onlyWhenLive: true,
        randomize: false,
        name: "",
        interval: 0,
        commands: []
      };

      $ctrl.commandList = commandsService.getCustomCommands().map(c => {
        return { id: c.id, trigger: c.trigger };
      });

      $ctrl.toggleCommand = id => {
        if ($ctrl.timer.commands.includes(id)) {
          $ctrl.timer.commands.filter(c => c.id !== id);
        } else {
          $ctrl.timer.commands.push(id);
        }
      };

      $ctrl.commandIsAdded = id => $ctrl.timer.commands.includes(id);

      $ctrl.$onInit = function() {
        if ($ctrl.resolve.timer == null) {
          $ctrl.isNewTimer = true;
        } else {
          $ctrl.timer = JSON.parse(JSON.stringify($ctrl.resolve.timer));
        }
      };

      $ctrl.delete = function() {
        if ($ctrl.timer) return;
        $ctrl.close({ $value: { timer: $ctrl.timer, action: "delete" } });
      };

      $ctrl.save = function() {
        if ($ctrl.timer.name === "" || $ctrl.timer.interval < 1) return;

        //remove commands that dont exist anymore
        let idList = $ctrl.commandList.filter(c => c.id);
        $ctrl.timer.commands = $ctrl.timer.commands.fitler(c =>
          idList.includes(c)
        );

        let action = $ctrl.isNewTimer ? "add" : "update";
        $ctrl.close({
          $value: {
            timer: $ctrl.timer,
            action: action
          }
        });
      };
    }
  });
})();
