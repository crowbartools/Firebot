"use strict";
(function() {

    // This handles the Events tab
    angular
        .module("firebotApp")
        .controller("eventsController", function($scope, eventsService, utilityService,
            backendCommunicator, objectCopyHelper) {

            $scope.es = eventsService;

            const sources = backendCommunicator.fireEventSync("getAllEventSources");

            function friendlyEventTypeName(sourceId, eventId) {
                const source = sources.find(s => s.id === sourceId);
                if (source != null) {
                    const event = source.events.find(e => e.id === eventId);
                    if (event != null) {
                        return `${event.name} (${source.name})`;
                    }
                }
                return null;
            }

            $scope.tableConfig = [
                {
                    name: "NAME",
                    icon: "fa-tag",
                    headerStyles: {
                        'min-width': '150px'
                    },
                    dataField: "name",
                    sortable: true,
                    cellTemplate: `{{data.name}}`,
                    cellController: () => {}
                },
                {
                    name: "TYPE",
                    icon: "fa-exclamation-square",
                    headerStyles: {
                        'min-width': '100px'
                    },
                    dataField: "eventId",
                    sortable: true,
                    cellTemplate: `{{data.eventId && data.sourceId ?
                        friendlyEventTypeName(data.sourceId, data.eventId) : "No
                        Type"}}`,
                    cellController: ($scope) => {
                        $scope.friendlyEventTypeName = friendlyEventTypeName;
                    }
                }
            ];

            $scope.getSelectedEvents = function() {
                const selectedTab = eventsService.getSelectedTab();
                if (selectedTab === "mainevents") {
                    return eventsService.getMainEvents();
                }

                if (eventsService.getEventGroup(selectedTab) == null) {
                    return eventsService.getMainEvents();
                }

                return eventsService.getEventGroup(selectedTab).events;
            };

            function updateEvent(groupId, event) {
                if (groupId === "mainevents") {
                    const mainEvents = eventsService.getMainEvents();
                    const index = mainEvents.findIndex(e => e.id === event.id);
                    mainEvents[index] = event;
                    eventsService.saveMainEvents();
                } else {
                    const group = eventsService.getEventGroup(groupId);
                    const index = group.events.findIndex(e => e.id === event.id);
                    group.events[index] = event;
                    eventsService.saveGroup(group);
                }
            }

            function deleteEvent(groupId, eventId) {
                if (groupId === "mainevents") {
                    const mainEvents = eventsService.getMainEvents();
                    const index = mainEvents.findIndex(e => e.id === eventId);
                    mainEvents.splice(index, 1);
                    eventsService.saveMainEvents();
                } else {
                    const group = eventsService.getEventGroup(groupId);
                    const index = group.events.findIndex(e => e.id === eventId);
                    group.events.splice(index, 1);
                    eventsService.saveGroup(group);
                }
            }

            $scope.updateEventsForCurrentGroup = (events) => {
                eventsService.updateEventsForCurrentGroup(events);
            };

            $scope.showCreateEventGroupModal = function() {
                utilityService.openGetInputModal(
                    {
                        model: "",
                        label: "New Event Set Name",
                        saveText: "Create",
                        validationFn: (value) => {
                            return new Promise((resolve) => {
                                if (value == null || value.trim().length < 1) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        },
                        validationText: "Event Set name cannot be empty."

                    },
                    (name) => {
                        eventsService.createGroup(name);
                    });
            };

            $scope.showRenameEventGroupModal = function(group) {
                utilityService.openGetInputModal(
                    {
                        model: group.name,
                        label: "Rename Event Set",
                        saveText: "Save",
                        validationFn: (value) => {
                            return new Promise((resolve) => {
                                if (value == null || value.trim().length < 1) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        },
                        validationText: "Event set name cannot be empty."

                    },
                    (name) => {
                        group.name = name;
                        eventsService.saveGroup(group);
                    });
            };

            $scope.showDeleteGroupModal = function(group) {
                utilityService
                    .showConfirmationModal({
                        title: "Delete Event Set",
                        question: `Are you sure you want to delete the event set "${group.name}"? This will delete all events within it.`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then((confirmed) => {
                        if (confirmed) {
                            eventsService.deleteGroup(group.id);
                        }
                    });
            };

            $scope.showAddOrEditEventModal = function(eventId) {

                const selectedGroupId = eventsService.getSelectedTab();
                let event;

                if (eventId != null) {
                    const selectedEvents = $scope.getSelectedEvents();
                    event = selectedEvents.find(e => e.id === eventId);
                }

                utilityService.showModal({
                    component: "addOrEditEventModal",
                    breadcrumbName: "Edit Event",
                    resolveObj: {
                        event: () => event,
                        groupId: () => selectedGroupId
                    },
                    closeCallback: (resp) => {
                        const { action, event, groupId } = resp;

                        switch (action) {
                            case "add":
                                if (groupId === "mainevents") {
                                    eventsService.getMainEvents().push(event);
                                    eventsService.saveMainEvents();
                                } else {
                                    const group = eventsService.getEventGroup(groupId);
                                    group.events.push(event);
                                    eventsService.saveGroup(group);
                                }
                                break;
                            case "update":
                                updateEvent(groupId, event);
                                break;
                            case "delete":
                                deleteEvent(groupId, event.id);
                                break;
                        }
                    }
                });
            };

            $scope.showDeleteEventModal = function(eventId, name) {
                utilityService
                    .showConfirmationModal({
                        title: "Delete Event",
                        question: `Are you sure you want to delete the event "${name}"?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then((confirmed) => {
                        if (confirmed) {
                            const groupId = eventsService.getSelectedTab();
                            deleteEvent(groupId, eventId);
                        }
                    });
            };

            $scope.toggleEventActiveStatus = function(eventId) {
                const groupId = eventsService.getSelectedTab();
                if (groupId === "mainevents") {
                    const event = eventsService.getMainEvents().find(e => e.id === eventId);
                    event.active = !event.active;
                    eventsService.saveMainEvents();
                } else {
                    const group = eventsService.getEventGroup(groupId);
                    const event = group.events.find(e => e.id === eventId);
                    event.active = !event.active;
                    eventsService.saveGroup(group);
                }
            };

            function addEventToGroup(event, groupId) {
                if (groupId === "mainevents") {
                    eventsService.getMainEvents().push(event);
                    eventsService.saveMainEvents();
                } else {
                    const group = eventsService.getEventGroup(groupId);
                    group.events.push(event);
                    eventsService.saveGroup(group);
                }
            }

            function moveEventToGroup(event, groupId) {
                const currentGroupId = eventsService.getSelectedTab();
                deleteEvent(currentGroupId, event.id);
                addEventToGroup(event, groupId);
            }

            $scope.duplicateEvent = function(eventId) {
                const groupId = eventsService.getSelectedTab();
                if (groupId === "mainevents") {
                    const event = eventsService.getMainEvents().find(e => e.id === eventId);

                    const copiedEvent = objectCopyHelper.copyObject("events", [event])[0];
                    copiedEvent.name += " copy";

                    eventsService.getMainEvents().push(copiedEvent);
                    eventsService.saveMainEvents();
                } else {
                    const group = eventsService.getEventGroup(groupId);
                    const event = group.events.find(e => e.id === eventId);

                    const copiedEvent = objectCopyHelper.copyObject("events", [event])[0];

                    copiedEvent.name += " copy";

                    group.events.push(copiedEvent);
                    eventsService.saveGroup(group);
                }
            };

            $scope.copyEvent = function(eventId) {
                const groupId = eventsService.getSelectedTab();
                if (groupId === "mainevents") {
                    const event = eventsService.getMainEvents().find(e => e.id === eventId);
                    objectCopyHelper.copyObject("events", [event]);
                } else {
                    const group = eventsService.getEventGroup(groupId);
                    const event = group.events.find(e => e.id === eventId);
                    objectCopyHelper.copyObject("events", [event]);
                }
            };

            $scope.hasCopiedEvents = function() {
                return objectCopyHelper.hasObjectCopied("events");
            };

            $scope.copyEvents = function(groupId) {
                if (groupId === "mainevents") {
                    const events = eventsService.getMainEvents();
                    objectCopyHelper.copyObject("events", events);
                } else {
                    const group = eventsService.getEventGroup(groupId);
                    objectCopyHelper.copyObject("events", group.events);
                }
            };

            $scope.pasteEvents = function(groupId) {
                if (!$scope.hasCopiedEvents()) {
                    return;
                }

                if (groupId === "mainevents") {
                    const copiedEvents = objectCopyHelper.getCopiedObject("events");

                    for (const copiedEvent of copiedEvents) {
                        eventsService.getMainEvents().push(copiedEvent);
                    }

                    eventsService.saveMainEvents();

                } else {
                    const group = eventsService.getEventGroup(groupId);
                    const copiedEvents = objectCopyHelper.getCopiedObject("events");

                    for (const copiedEvent of copiedEvents) {
                        group.events.push(copiedEvent);

                    }
                    eventsService.saveGroup(group);
                }

                eventsService.setSelectedTab(groupId);
            };

            $scope.eventMenuOptions = function(event) {

                const currentGroupId = eventsService.getSelectedTab();
                const availableGroups = [
                    { id: 'mainevents', name: "Main Events"},
                    ...eventsService.getEventGroups().map(g => ({ id: g.id, name: g.name }))
                ].filter(g => g.id !== currentGroupId);

                const options = [
                    {
                        html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                        click: () => {
                            $scope.showAddOrEditEventModal(event.id);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-toggle-off" style="margin-right: 10px;"></i> ${event.active ? "Disable Event" : "Enable Event"}</a>`,
                        click: () => {
                            $scope.toggleEventActiveStatus(event.id);
                        }
                    },
                    {
                        html: `<a href ><span class="iconify" data-icon="mdi:content-copy" style="margin-right: 10px;"></span> Copy</a>`,
                        click: () => {
                            $scope.copyEvent(event.id);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: () => {
                            $scope.duplicateEvent(event.id);
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: () => {
                            $scope.showDeleteEventModal(event.id, event.name ? event.name : 'Unnamed');
                        }
                    },
                    {
                        text: "Move to...",
                        children: availableGroups.map((g) => {
                            return {
                                html: `<a href>${g.name}</a>`,
                                click: () => {
                                    moveEventToGroup(event, g.id);
                                }
                            };
                        }),
                        hasTopDivider: true
                    }
                ];

                return options;
            };

            $scope.eventSetMenuOptions = function(group) {

                return [
                    {
                        html: `<a href ><i class="far fa-pen mr-4"></i> Rename</a>`,
                        click: () => {
                            $scope.showRenameEventGroupModal(group);
                        }
                    },
                    {
                        html: `<a href ><i class="fas mr-4 ${group.active ? 'fa-toggle-off' : 'fa-toggle-on'}"></i> ${group.active ? 'Deactivate' : 'Activate'}</a>`,
                        click: () => {
                            eventsService.toggleEventGroupActiveStatus(group.id);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-clone mr-4"></i> Duplicate set</a>`,
                        click: () => {
                            eventsService.duplicateEventGroup(group);
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373"><i class="far fa-trash-alt mr-4"></i> Delete set</a>`,
                        click: () => {
                            $scope.showDeleteGroupModal(group);
                        }
                    },
                    {
                        html: `<a href ><span class="iconify mr-4" data-icon="mdi:content-copy"></span> Copy events</a>`,
                        click: () => {
                            $scope.copyEvents(group.id);
                        },
                        hasTopDivider: true
                    },
                    {
                        html: `<a href><span class="iconify mr-4" data-icon="mdi:content-paste" ng-class="{'disabled': !hasCopiedEvents()}"></span> Paste event(s)</a>`,
                        click: () => {
                            $scope.pasteEvents(group.id);
                        },
                        enabled: $scope.hasCopiedEvents()
                    }
                ];
            };

            $scope.simulateEventsByType = function() {
                utilityService.showModal({
                    component: "simulateGroupEventsModal",
                    size: "sm"
                });
            };

            /**
             * Returns an integer of total number of effects in an event.
             */
            $scope.getEventEffectsCount = function(event) {
                if (event.effects && event.effects.list) {
                    return event.effects.list.length;
                }
                return 0;
            };

            // Fire event manually
            $scope.fireEventManually = function(eventId) {
                const event = $scope.getSelectedEvents().find(e => e.id === eventId);
                if (event != null) {
                    ipcRenderer.send("triggerManualEvent", {
                        eventId: event.eventId,
                        sourceId: event.sourceId,
                        eventSettingsId: event.id
                    });
                }
            };
        });
}());
