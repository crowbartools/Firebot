"use strict";

(function() {
    //This handles events
    const _ = require("underscore")._;
    const EventType = require("../../lib/live-events/EventType.js");
    const profileManager = require("../../lib/common/profile-manager.js");
    const { ipcRenderer } = require("electron");
    const uuidv1 = require("uuid/v1");

    angular.module("firebotApp").factory("eventsService", function(logger, backendCommunicator) {
        let service = {};

        let mainEvents = [],
            activeGroup = null,
            groups = [];


        function loadAllEventData() {
            let eventData = backendCommunicator.fireEventSync("getAllEventData");

            if (eventData.mainEvents) {
                mainEvents = eventData.mainEvents;
            }

            if (eventData.activeGroup) {
                activeGroup = eventData.activeGroup;
            }

            if (eventData.groups) {
                groups = eventData.groups;
            }
        }
        loadAllEventData();


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

        service.setActiveEventGroup = function(groupId) {
            activeGroup = groupId;
            backendCommunicator.fireEvent("eventUpdate", {
                action: "setActiveGroup",
                meta: groupId
            });
        };

        service.groupIsActive = function(groupId) {
            return activeGroup === groupId;
        };

        service.getEventGroups = function() {
            return groups;
        };

        service.getEventGroup = function(groupId) {
            return groups.find(g => g.id === groupId);
        };

        service.createGroup = function(name) {
            let newId = uuidv1();
            const newGroup = {
                id: newId,
                name: name,
                events: []
            };
            service.saveGroup(newGroup);

            service.setSelectedTab(newId);

            if (groups.length === 1) {
                service.setActiveEventGroup(newId);
            }
        };

        service.saveGroup = function(group) {
            let existingIndex = groups.findIndex(g => g.id === group.id);
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

        service.deleteGroup = function(groupId) {
            groups = groups.filter(g => g.id !== groupId);
            if (activeGroup === groupId) {
                activeGroup = null;
            }
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

        service.saveMainEvents = function() {
            backendCommunicator.fireEvent("eventUpdate", {
                action: "saveMainEvents",
                meta: mainEvents
            });
        };

        return service;
    });
}());
