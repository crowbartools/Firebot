"use strict";

const { sort } = require("mathjs");

(function() {
    //This handles events
    const uuidv1 = require("uuid/v1");

    angular.module("firebotApp").factory("eventsService", function(logger, backendCommunicator, objectCopyHelper, utilityService) {
        let service = {};

        let mainEvents = [];
        let groups = [];
        let sortTags = [];


        function loadAllEventData() {
            let eventData = backendCommunicator.fireEventSync("getAllEventData");

            if (eventData.mainEvents) {
                mainEvents = eventData.mainEvents;
            }

            if (eventData.groups) {
                groups = eventData.groups;
            }

            if (eventData.sortTags) {
                sortTags = eventData.sortTags;
            }
        }
        loadAllEventData();

        backendCommunicator.on("main-events-update", () => {
            loadAllEventData();
        });

        backendCommunicator.on("event-group-update", (group) => {
            const index = groups.findIndex(g => g.id === group.id);
            if (index < 0) return;
            groups[index] = group;
        });

        service.openManageTagsModal = () => {
            utilityService.showModal({
                component: "manageSortTagsModal",
                size: "sm",
                resolveObj: {
                    tags: () => sortTags
                },
                closeCallback: tags => {
                    sortTags = tags;
                    backendCommunicator.fireEvent("event-sort-tags-update", sortTags);
                    if (service.selectedSortTag && !sortTags.some(t => t.id === service.selectedSortTag.id)) {
                        service.selectedSortTag = null;
                    }
                }
            });
        };

        service.getSortTags = () => {
            return sortTags;
        };
        service.selectedSortTag = null;
        service.selectedSortTagDisplay = () => {
            return service.selectedSortTag != null ? service.selectedSortTag.name : "All Events";
        };
        service.setSelectedSortTag = (tag) => {
            service.selectedSortTag = tag;
        };


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

        service.createGroup = function(name) {
            let newId = uuidv1();
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

            let duplicatedGroup = objectCopyHelper.copyObject("eventgroup", group);

            duplicatedGroup.name += " copy";

            service.saveGroup(duplicatedGroup);

            service.setSelectedTab(duplicatedGroup.id);
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

        service.saveMainEvents = function() {
            backendCommunicator.fireEvent("eventUpdate", {
                action: "saveMainEvents",
                meta: mainEvents
            });
        };

        return service;
    });
}());
