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
            settingsService,
            listenerService
        ) {
            $scope.es = eventsService;


            let selectedGroupId = "mainevents";
            $scope.setSelectedGroup = function(groupId) {
                selectedGroupId = groupId;
            };

            $scope.groupIsSelected = function(groupId) {
                return selectedGroupId === groupId;
            };

            $scope.showCreateEventGroupModal = function() {

                utilityService.openGetInputModal(
                    {
                        model: "",
                        label: "New Event Group Name",
                        saveText: "Create",
                        validationFn: (value) => {
                            return new Promise(resolve => {
                                if (value == null || value.trim().length < 1) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        },
                        validationText: "Group name cannot be empty."

                    },
                    (name) => {
                        eventsService.createGroup(name);
                    });
            };

            $scope.showDeleteGroupModal = function(group) {
                utilityService
                    .showConfirmationModal({
                        title: "Delete Event Group",
                        question: `Are you sure you want to delete the event group "${group.name}"?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then(confirmed => {
                        if (confirmed) {
                            eventsService.deleteGroup(group.id);
                        }
                    });
            };


            /**
             * OLD STUFF !!!!!!!!!!!!!!
             */

            /**
       *  Returns an integer of total number of event groups.
       */
            $scope.getEventGroupCount = function() {
                let allEventGroups = eventsService.getAllEventGroups();

                if (allEventGroups != null) {
                    return Object.keys(eventsService.getAllEventGroups()).length;
                }

                return 0;
            };

            /**
       * Returns an integer of total number of events in selected event group.
       */
            $scope.getGroupEventsCount = function() {
                let groupJson = eventsService.getActiveEventGroupJson(),
                    eventsLength = 0;

                if (groupJson != null && groupJson.events != null) {
                    eventsLength = Object.keys(groupJson.events).length;
                }

                if (eventsLength != null) {
                    return eventsLength;
                }

                return 0;
            };

            /**
       * Returns an integer of total number of effects in an event.
       */
            $scope.getEventEffectsCount = function(eventId) {
                let groupJson = eventsService.getActiveEventGroupJson(),
                    eventJson = groupJson.events[eventId],
                    effectsLength = 0;

                if (eventJson != null && eventJson.effects != null) {
                    effectsLength = Object.keys(eventJson.effects).length;
                }

                if (effectsLength != null) {
                    return effectsLength;
                }

                return 0;
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
                    eventName,
                    finalArray = [];

                for (eventName in eventsJson) {
                    if (eventName != null) {
                        finalArray.push(eventsJson[eventName]);
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
            $scope.fireEventManually = function(event) {
                ipcRenderer.send("triggerManualEvent", {
                    eventId: event.eventId,
                    sourceId: event.sourceId
                });
            };

            // Set Events view mode.
            $scope.saveCurrentEventsViewMode = function(mode, type) {
                $scope.eventsViewMode = mode;
                settingsService.setButtonViewMode(mode, type);
            };

            /**
       * Gets user friendly event name from the EventType list.
       */

            let sources = listenerService.fireEventSync("getAllEventSources");
            $scope.friendlyEventTypeName = function(sourceId, eventId) {
                let source = sources.find(s => s.id === sourceId);
                if (source != null) {
                    let event = source.events.find(e => e.id === eventId);
                    if (event != null) {
                        return `${event.name} (${source.name})`;
                    }
                }
                return null;
            };

            /**
       * Toggles the active state of a given event id.
       * @param {*} eventId;
       */
            $scope.toggleEventActiveState = function(eventId) {
                eventsService.toggleEventActiveState(eventId);
            };

            /*
      * ADD Event Group Modal
      */
            $scope.showEventGroupModal = function(eventGroupToEdit) {
                let showEventGroupModalContext = {
                    templateUrl: "showEventGroupModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: (
                        $scope,
                        $uibModalInstance,
                        utilityService,
                        eventGroupToEdit
                    ) => {
                        // The model for the board id text field
                        $scope.eventGroup = {
                            name: ""
                        };

                        $scope.isNewGroup = eventGroupToEdit == null;

                        if (!$scope.isNewGroup) {
                            $scope.eventGroup = $.extend(true, {}, eventGroupToEdit);
                        }

                        // When the user clicks "Save/Add", we want to pass the event back
                        $scope.saveChanges = function(shouldDelete) {
                            shouldDelete = shouldDelete === true;

                            let name = $scope.eventGroup.name;

                            if (!shouldDelete && name === "") return;
                            $uibModalInstance.close({
                                shouldDelete: shouldDelete,
                                eventGroup: shouldDelete ? eventGroupToEdit : $scope.eventGroup
                            });
                        };

                        // When they hit cancel or click outside the modal, we dont want to do anything
                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss();
                        };
                    },
                    resolveObj: {
                        eventGroupToEdit: () => {
                            if (eventGroupToEdit != null) {
                                return $.extend(true, {}, eventGroupToEdit);
                            }
                            return null;
                        }
                    },
                    // The callback to run after the modal closed via "Save changes" or "Delete"
                    closeCallback: context => {
                        let eventGroup = context.eventGroup;
                        if (context.shouldDelete === true) {
                            eventsService.removeEventGroup(eventGroup.id);
                        } else {
                            eventsService.addOrUpdateEventGroup(eventGroup);
                        }
                    }
                };
                utilityService.showModal(showEventGroupModalContext);
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
                            name: "",
                            active: true
                        };

                        $scope.isNewEvent = eventToEdit == null;

                        if (!$scope.isNewEvent) {
                            $scope.event = $.extend(true, {}, eventToEdit);
                        }

                        $scope.effectListUpdated = function(effects) {
                            $scope.event["effects"] = effects;
                        };

                        $scope.eventChanged = function(event) {
                            $scope.event.eventId = event.eventId;
                            $scope.event.sourceId = event.sourceId;
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

            /**
       * Delete Event Modal
       */
            $scope.showEventDeleteModal = function(event) {
                utilityService
                    .showConfirmationModal({
                        title: "Delete Event",
                        question: "Are you sure you'd like to delete this event?",
                        confirmLabel: "Delete"
                    })
                    .then(confirmed => {
                        if (confirmed) {
                            console.log(event);
                            eventsService.removeEvent(event.id);
                        }
                    });
            };

            /**
       * Delete Event Group Modal
       */
            $scope.showEventGroupDeleteModal = function(eventGroup) {
                utilityService
                    .showConfirmationModal({
                        title: "Delete Event Group",
                        question: "Are you sure you'd like to delete this event group?",
                        confirmLabel: "Delete"
                    })
                    .then(confirmed => {
                        if (confirmed) {
                            eventsService.removeEventGroup(eventGroup.id);
                        }
                    });
            };
        });
}(window.jQuery));
