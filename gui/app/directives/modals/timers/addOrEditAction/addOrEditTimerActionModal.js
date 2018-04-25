"use strict";

// Modal for adding or editting a command

(function() {
  angular.module("firebotApp").component("addOrEditTimerActionModal", {
    templateUrl:
      "./directives/modals/timers/addOrEditAction/addOrEditTimerActionModal.html",
    bindings: {
      resolve: "<",
      close: "&",
      dismiss: "&",
      modalInstance: "<"
    },
    controller: function(
      $scope,
      commandsService,
      boardService,
      utilityService
    ) {
      let $ctrl = this;

      $ctrl.action = {
        type: "Run Effects",
        metadata: {}
      };

      $ctrl.$onInit = function() {
        if ($ctrl.resolve.action == null) {
          $ctrl.isNewAction = true;
        } else {
          $ctrl.action = JSON.parse(JSON.stringify($ctrl.resolve.action));
        }

        let modalId = $ctrl.resolve.modalId;
        utilityService.addSlidingModal(
          $ctrl.modalInstance.rendered.then(() => {
            let modalElement = $("." + modalId).children();
            return {
              element: modalElement,
              name: "Edit Action",
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
        $ctrl.action.metadata.effects = effects;
      };

      $ctrl.commands = commandsService.getCustomCommands().map(c => {
        return { id: c.id, trigger: c.trigger };
      });

      $ctrl.buttons = [];
      boardService.getAllBoards().forEach(b => {
        Object.values(b.controls).forEach(c => {
          $ctrl.buttons.push({
            id: c.controlId,
            text: c.text,
            scene: c.scene,
            board: {
              id: b.versionId,
              name: b.name
            }
          });
        });
      });

      $ctrl.delete = function() {
        if ($ctrl.action) return;
        $ctrl.close({
          $value: { action: $ctrl.action, responseAction: "delete" }
        });
      };

      $ctrl.save = function() {
        let action = $ctrl.isNewAction ? "add" : "update";
        $ctrl.close({
          $value: {
            action: $ctrl.action,
            index: $ctrl.resolve.index,
            responseAction: action
          }
        });
      };
    }
  });
})();
