"use strict";
(function() {

    // This handles the Events tab
    angular
        .module("firebotApp")
        .controller("eventsController", function($scope, eventsService, utilityService, listenerService, objectCopyHelper) {

            $scope.es = eventsService;

            $scope.getSelectedEvents = function() {
                let selectedTab = eventsService.getSelectedTab();
                if (selectedTab === "mainevents") {
                    return eventsService.getMainEvents();
                }
                return eventsService.getEventGroup(selectedTab).events;
            };

            function updateEvent(groupId, index, event) {
                if (groupId === "mainevents") {
                    eventsService.getMainEvents()[index] = event;
                    eventsService.saveMainEvents();
                } else {
                    let group = eventsService.getEventGroup(groupId);
                    group.events[index] = event;
                    eventsService.saveGroup(group);
                }
            }

            function deleteEvent(groupId, index) {
                if (groupId === "mainevents") {
                    eventsService.getMainEvents().splice(index, 1);
                    eventsService.saveMainEvents();
                } else {
                    let group = eventsService.getEventGroup(groupId);
                    group.events.splice(index, 1);
                    eventsService.saveGroup(group);
                }
            }

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

            $scope.showRenameEventGroupModal = function(group) {
                utilityService.openGetInputModal(
                    {
                        model: group.name,
                        label: "Rename Event Group",
                        saveText: "Save",
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
                        group.name = name;
                        eventsService.saveGroup(group);
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

            $scope.showAddOrEditEventModal = function(index) {

                let selectedGroupId = eventsService.getSelectedTab(),
                    event;

                if (index !== null && index !== undefined) {
                    let selectedEvents = $scope.getSelectedEvents();
                    event = selectedEvents[index];
                }

                utilityService.showModal({
                    component: "addOrEditEventModal",
                    resolveObj: {
                        event: () => event,
                        index: () => index,
                        groupId: () => selectedGroupId
                    },
                    closeCallback: resp => {
                        let { action, event, groupId, index } = resp;

                        switch (action) {
                        case "add":
                            if (groupId === "mainevents") {
                                eventsService.getMainEvents().push(event);
                                eventsService.saveMainEvents();
                            } else {
                                let group = eventsService.getEventGroup(groupId);
                                group.events.push(event);
                                eventsService.saveGroup(group);
                            }
                            break;
                        case "update":
                            updateEvent(groupId, index, event);
                            break;
                        case "delete":
                            deleteEvent(groupId, index);
                            break;
                        }
                    }
                });
            };

            $scope.showDeleteEventModal = function(index, name) {
                utilityService
                    .showConfirmationModal({
                        title: "Delete Event",
                        question: `Are you sure you want to delete the event "${name}"?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then(confirmed => {
                        if (confirmed) {
                            let groupId = eventsService.getSelectedTab();
                            deleteEvent(groupId, index);
                        }
                    });
            };

            $scope.getEventActiveStatus = function(active) {
                let groupId = eventsService.getSelectedTab();
                if (groupId !== "mainevents") {
                    let groupIsActive = eventsService.groupIsActive(groupId);
                    if (!groupIsActive) {
                        return false;
                    }
                }
                return active;
            };

            $scope.getEventActiveStatusDisplay = function(active) {

                let groupId = eventsService.getSelectedTab();
                if (groupId !== "mainevents") {
                    let groupIsActive = eventsService.groupIsActive(groupId);
                    if (!groupIsActive) {
                        return "Disabled (Group not active)";
                    }
                }

                return active ? "Enabled" : "Disabled";
            };

            $scope.toggleEventActiveStatus = function(index) {
                let groupId = eventsService.getSelectedTab();
                if (groupId === "mainevents") {
                    let event = eventsService.getMainEvents()[index];
                    event.active = !event.active;
                    eventsService.saveMainEvents();
                } else {
                    let group = eventsService.getEventGroup(groupId);
                    let event = group.events[index];
                    event.active = !event.active;
                    eventsService.saveGroup(group);
                }
            };

            $scope.duplicateEvent = function(index) {
                let groupId = eventsService.getSelectedTab();
                if (groupId === "mainevents") {
                    let event = eventsService.getMainEvents()[index];

                    let copiedEvent = objectCopyHelper.copyObject("events", [event])[0];
                    copiedEvent.name += " copy";

                    eventsService.getMainEvents().push(copiedEvent);
                    eventsService.saveMainEvents();
                } else {
                    let group = eventsService.getEventGroup(groupId);
                    let event = group.events[index];

                    let copiedEvent = objectCopyHelper.copyObject("events", [event])[0];

                    copiedEvent.name += " copy";

                    group.events.push(copiedEvent);
                    eventsService.saveGroup(group);
                }
            };

            $scope.copyEvent = function(index) {
                let groupId = eventsService.getSelectedTab();
                if (groupId === "mainevents") {
                    let event = eventsService.getMainEvents()[index];
                    objectCopyHelper.copyObject("events", [event]);
                } else {
                    let group = eventsService.getEventGroup(groupId);
                    let event = group.events[index];
                    objectCopyHelper.copyObject("events", [event]);
                }
            };

            $scope.hasCopiedEvents = function() {
                return objectCopyHelper.hasObjectCopied("events");
            };

            $scope.copyEvents = function(groupId) {
                if (groupId === "mainevents") {
                    let events = eventsService.getMainEvents();
                    objectCopyHelper.copyObject("events", events);
                } else {
                    let group = eventsService.getEventGroup(groupId);
                    objectCopyHelper.copyObject("events", group.events);
                }
            };

            $scope.pasteEvents = function(groupId) {
                if (!$scope.hasCopiedEvents()) return;
                if (groupId === "mainevents") {
                    let copiedEvents = objectCopyHelper.getCopiedObject("events");

                    for (let copiedEvent of copiedEvents) {
                        eventsService.getMainEvents().push(copiedEvent);
                    }

                    eventsService.saveMainEvents();

                } else {
                    let group = eventsService.getEventGroup(groupId);
                    let copiedEvents = objectCopyHelper.getCopiedObject("events");

                    for (let copiedEvent of copiedEvents) {
                        group.events.push(copiedEvent);

                    }
                    eventsService.saveGroup(group);
                }

                eventsService.setSelectedTab(groupId);
            };

            $scope.selectedGroupIsActive = function() {
                let groupId = eventsService.getSelectedTab();
                if (groupId === "mainevents") {
                    return true;
                }
                return eventsService.groupIsActive(groupId);
            };

            $scope.eventMenuOptions = [
                {
                    html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                    click: function ($itemScope) {
                        let index = $itemScope.$index;
                        $scope.showAddOrEditEventModal(index);
                    }
                },
                {
                    html: `<a href ><i class="far fa-toggle-off" style="margin-right: 10px;"></i> Toggle Enabled</a>`,
                    click: function ($itemScope) {
                        let index = $itemScope.$index;
                        $scope.toggleEventActiveStatus(index);
                    }
                },
                {
                    html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                    click: function ($itemScope) {
                        let index = $itemScope.$index;
                        let event = $itemScope.event;
                        $scope.showDeleteEventModal(index, event.name ? event.name : 'Unnamed');
                    }
                }
            ];


            /**
             * Returns an integer of total number of effects in an event.
             */
            $scope.getEventEffectsCount = function(event) {
                if (event.effects && event.effects.list) {
                    return event.effects.list.length;
                }
                return 0;
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

            // Fire event manually
            $scope.fireEventManually = function(event) {
                ipcRenderer.send("triggerManualEvent", {
                    eventId: event.eventId,
                    sourceId: event.sourceId,
                    eventSettingsId: event.id
                });
            };
        });
}());
