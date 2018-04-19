"use strict";
(function($) {
  // This handles the Events tab
  const EventType = require("../../lib/live-events/EventType.js");

  angular
    .module("firebotApp")
    .controller("eventsController", function(
      $scope,
      eventsService,
      utilityService,
      settingsService
    ) {
      $scope.eventsService = eventsService;
      $scope.eventsViewMode = settingsService.getButtonViewMode("liveEvents");

      /**
       *  Returns an integer of total number of event groups.
       */
      $scope.getEventGroupCount = function() {
        return Object.keys(eventsService.getAllEventGroups()).length;
      };

      /**
       * Returns full event json.
       */
      $scope.getAllEventGroups = function() {
        return eventsService.getAllEventGroups();
      };

      /**
       * Returns the json for the selected event group.
       */
      $scope.selectedEventGroup = function() {
        return eventsService.getActiveEventGroupJson();
      };

      /**
       * Returns events from current group in an array for the ui.
       */
      $scope.selectedEventsArray = function() {
        let groupJson = eventsService.getActiveEventGroupJson(),
          eventsJson = groupJson.events,
          finalArray = [];

        for (event in eventsJson) {
          if (event != null) {
            finalArray.push(eventsJson[event]);
          }
        }

        return finalArray;
      };

      /**
       * Switches to a new event group.
       */
      $scope.switchToEventGroup = function(groupId) {
        eventsService.setActiveEventGroup(groupId);
      };

      // Fire event manually
      $scope.fireEventManually = function(eventId) {
        ipcRenderer.send("manualEvent", eventId);
      };

      // Set Events view mode.
      $scope.saveCurrentEventsViewMode = function(mode, type) {
        $scope.eventsViewMode = mode;
        settingsService.setButtonViewMode(mode, type);
      };

      /**
       * Gets user friendly event name from the EventType list.
       */
      $scope.friendlyEventTypeName = function(type) {
        return eventsService.getEventTypeName(type);
      };

      /*
      * ADD/EDIT EVENT MODAL
      */
      $scope.showAddEditEventModal = function(eventToEdit) {
        let addEditEventsModalContext = {
          templateUrl: "addEditEventModal.html",
          // This is the controller to be used for the modal.
          controllerFunc: (
            $scope,
            $uibModalInstance,
            utilityService,
            eventToEdit
          ) => {
            $scope.eventDefinitions = EventType.getEventDefinitions();

            // The model for the board id text field
            $scope.event = {
              name: ""
            };

            $scope.isNewEvent = eventToEdit == null;

            if (!$scope.isNewEvent) {
              $scope.event = $.extend(true, {}, eventToEdit);
            }

            $scope.selectedEventTypeName = $scope.event.type
              ? EventType.getEvent($scope.event.type).name
              : "Pick one";

            $scope.eventTypeSelected = function(event) {
              $scope.selectedEventTypeName = event.name;
              $scope.event.type = event.id;
            };

            $scope.effectListUpdated = function(effects) {
              $scope.event["effects"] = effects;
            };

            // When the user clicks "Save/Add", we want to pass the event back
            $scope.saveChanges = function(shouldDelete) {
              shouldDelete = shouldDelete === true;

              let name = $scope.event.name;

              if (!shouldDelete && name === "") return;
              $uibModalInstance.close({
                shouldDelete: shouldDelete,
                event: shouldDelete ? eventToEdit : $scope.event
              });
            };

            // When they hit cancel or click outside the modal, we dont want to do anything
            $scope.dismiss = function() {
              $uibModalInstance.dismiss();
            };
          },
          resolveObj: {
            eventToEdit: () => {
              if (eventToEdit != null) {
                return $.extend(true, {}, eventToEdit);
              }
              return null;
            }
          },
          // The callback to run after the modal closed via "Save changes" or "Delete"
          closeCallback: context => {
            let event = context.event;
            if (context.shouldDelete === true) {
              eventsService.removeEvent(event.id);
            } else {
              eventsService.addOrUpdateEvent(event);
            }
          }
        };
        utilityService.showModal(addEditEventsModalContext);
      };
    });
})(window.jQuery);
