"use strict";

(function() {
    //This handles events
    const { v4: uuid } = require("uuid");

    angular.module("firebotApp").factory("eventsService", function(backendCommunicator, objectCopyHelper) {
        const service = {};

        let mainEvents = [];
        let groups = [];


        function loadAllEventData() {
            const eventData = backendCommunicator.fireEventSync("getAllEventData");

            if (eventData.mainEvents) {
                mainEvents = eventData.mainEvents;
            }

            if (eventData.groups) {
                groups = eventData.groups;
            }
        }
        loadAllEventData();

        backendCommunicator.on("main-events-update", () => {
            loadAllEventData();
        });

        backendCommunicator.on("event-group-update", (group) => {
            const index = groups.findIndex(g => g.id === group.id);
            if (index < 0) {
                return;
            }

            groups[index] = group;
        });

        let selectedTab = "mainevents";
        service.setSelectedTab = function(groupId) {
            selectedTab = groupId;
        };

        service.tabIsSelected = function(groupId) {
            return selectedTab === groupId;
        };

        service.getSelectedTab = function() {
            return selectedTab;
        };

        service.getEventGroups = function() {
            return groups;
        };

        service.getEventGroup = function(groupId) {
            return groups.find(g => g.id === groupId);
        };

        service.updateEventsForCurrentGroup = function(events) {
            if (service.getSelectedTab() === "mainevents") {
                mainEvents = events;
                service.saveMainEvents();
            } else {
                const group = service.getEventGroup(service.getSelectedTab());
                if (group != null) {
                    group.events = events;
                    service.saveGroup(group);
                }
            }
        };

        service.createGroup = function(name) {
            const newId = uuid();
            const newGroup = {
                id: newId,
                name: name,
                active: true,
                events: []
            };
            service.saveGroup(newGroup);

            service.setSelectedTab(newId);
        };

        service.duplicateEventGroup = function(group) {

            const duplicatedGroup = objectCopyHelper.copyObject("eventgroup", group);

            duplicatedGroup.name += " copy";

            service.saveGroup(duplicatedGroup);

            service.setSelectedTab(duplicatedGroup.id);
        };

        service.saveEvent = (eventToSave) => {
            const indexInMain = mainEvents.findIndex(e => e.id === eventToSave.id);
            if (indexInMain > -1) {
                mainEvents[indexInMain] = eventToSave;
                service.saveMainEvents();
                return;
            }

            groups.forEach(group => {
                const indexInGroup = group.events.findIndex(e => e.id === eventToSave.id);
                if (indexInGroup > -1) {
                    group.events[indexInGroup] = eventToSave;
                    service.saveGroup(group);
                    return;
                }
            });
        };

        service.saveGroup = function(group) {
            const existingIndex = groups.findIndex(g => g.id === group.id);
            if (existingIndex >= 0) {
                groups[existingIndex] = group;
            } else {
                groups.push(group);
            }
            backendCommunicator.fireEvent("eventUpdate", {
                action: "saveGroup",
                meta: group
            });
        };

        service.toggleEventGroupActiveStatus = function(groupId) {
            const group = service.getEventGroup(groupId);
            if (group) {
                group.active = !group.active;
            }
            backendCommunicator.fireEvent("eventUpdate", {
                action: "saveGroup",
                meta: JSON.parse(angular.toJson(group))
            });
        };

        service.deleteGroup = function(groupId) {
            groups = groups.filter(g => g.id !== groupId);
            if (selectedTab === groupId) {
                service.setSelectedTab("mainevents");
            }
            backendCommunicator.fireEvent("eventUpdate", {
                action: "deleteGroup",
                meta: groupId
            });
        };

        service.getMainEvents = function() {
            return mainEvents;
        };

        service.getAllEventGroups = () => {
            return groups;
        };

        service.getAllEvents = () => {
            return [
                ...mainEvents,
                ...groups.map(g => g.events)
                    .reduce((a, b) => a.concat(b), [])
            ];
        };

        service.saveMainEvents = function() {
            backendCommunicator.fireEvent("eventUpdate", {
                action: "saveMainEvents",
                meta: mainEvents
            });
        };

        return service;
    });
}());
