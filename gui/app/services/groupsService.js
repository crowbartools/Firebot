'use strict';

(function() {

    //This handles groups

    const _ = require('underscore')._;
    const dataAccess = require('../../lib/common/data-access.js');
    const {ipcRenderer} = require('electron');

    angular
        .module('firebotApp')
        .factory('groupsService', function (boardService, listenerService, logger) {
            let service = {};

            let groups = [];
            let sparkExemptGroup = [];


            function saveBannedGroup() {
                let dbGroup = dataAccess.getJsonDbInUserData("/user-settings/groups");
                let bannedGroup = service.getBannedGroup();
                dbGroup.push("/" + bannedGroup.groupName, bannedGroup);
            }

            function saveExemptGroup() {
                let dbGroup = dataAccess.getJsonDbInUserData("/user-settings/settings");
                let exemptGroup = service.getExemptGroup();
                dbGroup.push("/sparkExempt", exemptGroup);
            }

            function ensureExemptGroupExists() {
                let exemptGroupExists = _.any(sparkExemptGroup, (group) => {
                    return group.groupName === 'sparkExempt';
                });

                if (!exemptGroupExists) {
                    let exemptGroup = {
                        groupName: 'sparkExempt',
                        users: [],
                        groups: []
                    };
                    let dbGroup = dataAccess.getJsonDbInUserData("/user-settings/settings");
                    dbGroup.push("/sparkExempt", exemptGroup);
                    sparkExemptGroup.push(exemptGroup);
                }
            }

            function deleteViewerGroup(groupName) {
                let dbGroup = dataAccess.getJsonDbInUserData("/user-settings/groups");
                dbGroup.delete("/" + groupName);

                boardService.deleteViewerGroupFromAllBoards(groupName);
            }

            /**
            * Banned Usergroup Methods
            */

            function ensureBannedGroupExists() {
                let bannedGroupExists = _.any(groups, (group) => {
                    return group.groupName === 'banned';
                });

                if (!bannedGroupExists) {
                    let bannedGroup = {
                        groupName: 'banned',
                        users: []
                    };
                    let dbGroup = dataAccess.getJsonDbInUserData("/user-settings/groups");
                    dbGroup.push("/" + bannedGroup.groupName, bannedGroup);
                    groups.push(bannedGroup);
                }
            }

            service.loadViewerGroups = function() {
                // Load up all custom made groups in each dropdown.
                let dbGroup = dataAccess.getJsonDbInUserData("/user-settings/groups");
                try {
                    let rawGroups = dbGroup.getData('/');
                    if (rawGroups != null) {
                        groups = _.values(rawGroups);
                    }
                    ensureBannedGroupExists();
                } catch (err) {
                    logger.error(err);
                }

                // Load up exempt group
                dbGroup = dataAccess.getJsonDbInUserData("/user-settings/settings");
                try {
                    sparkExemptGroup.push(dbGroup.getData('/sparkExempt'));
                } catch (err) {} //eslint-disable-line no-empty
            };

            service.getViewerGroups = function(filterOutBannedGroup) {
                let groupList = [];
                if (groups != null) {
                    // Filter out the banned group. This will happen by default, even if the
                    // argument isn't passed.
                    if (filterOutBannedGroup !== false) {
                        groupList = _.reject(groups, (group) => {
                            return group.groupName === "banned";
                        });
                    } else {
                        groupList = groups;
                    }
                }
                return groupList;
            };

            service.getViewerGroupNames = function() {
                return service.getViewerGroups().map((g) => {
                    return g.groupName;
                });
            };

            service.getDefaultAndCustomViewerGroupNames = function() {
                return service.getDefaultGroups().concat(service.getViewerGroupNames());
            };

            // Returns all valid groups for spark exemption.
            service.getDefaultAndCustomViewerGroupsForSparkExempt = function () {
                // This removes the "Streamer" role because streamers are always spark exempt on their own channel.
                let groups = service.getDefaultGroups(),
                    groupsFixed = groups.filter(item => item !== 'Streamer');
                return groupsFixed.concat(service.getViewerGroupNames());
            };

            service.getDefaultGroups = function() {
                return [
                    "Pro",
                    "Subscribers",
                    "Moderators",
                    "Channel Editors",
                    "Staff",
                    "Streamer"
                ];
            };

            service.getAllGroups = function() {
                let groupList = service.getDefaultGroups();
                let activeGroups = service.getActiveGroups();
                let inactiveGroups = service.getInactiveGroups();

                // Push groups to array.
                for (let group in activeGroups) {
                    if (activeGroups.hasOwnProperty(group)) {
                        group = activeGroups[group];
                        groupList.push(group);
                    }
                }

                for (let group in inactiveGroups) {
                    if (inactiveGroups.hasOwnProperty(group)) {
                        group = inactiveGroups[group];
                        groupList.push(group);
                    }
                }

                // Filter out duplicates
                groupList = groupList.filter(function(elem, pos) {
                    return groupList.indexOf(elem) === pos;
                });

                return groupList;
            };

            service.getActiveGroups = function() {
                // Get the selected board and set default groupList var.
                let dbGroup = boardService.getSelectedBoard();
                let groupList = [];

                // Go through each scene on the current board and push default groups to groupList.
                if (dbGroup != null) {
                    for (let scene in dbGroup.scenes) {
                        if (dbGroup.scenes.hasOwnProperty(scene)) {
                            scene = dbGroup.scenes[scene];
                            let sceneGroups = scene.default;
                            for (let item of sceneGroups) {
                                if (item !== "None") {
                                    groupList.push(item);
                                }
                            }
                        }
                    }

                    // Filter out duplicates
                    groupList = groupList.filter(function(elem, pos) {
                        return groupList.indexOf(elem) === pos;
                    });
                }

                return groupList;
            };

            // Get groups that dont have scenes assigned as a default
            service.getInactiveGroups = function() {
                let inactiveGroups = [];

                let customGroups = service.getViewerGroups()
                    .map((group) => {
                        return group.groupName;
                    });

                let allGroups = service.getDefaultGroups().concat(customGroups);

                let activeGroups = service.getActiveGroups();

                // filter out active groups
                inactiveGroups = allGroups.filter((groupName) => {
                    return !activeGroups.includes(groupName);
                });

                return inactiveGroups;
            };

            service.addOrUpdateViewerGroup = function(group, previousName) {
                if (group.groupName === "banned") return;
                let dbGroup = dataAccess.getJsonDbInUserData("/user-settings/groups");

                if (previousName != null && previousName !== "" && previousName !== group.groupName) {
                    deleteViewerGroup(previousName);
                }

                dbGroup.push("/" + group.groupName, group);

                service.loadViewerGroups();
            };

            service.removeViewerGroup = function(groupName) {

                deleteViewerGroup(groupName);

                service.loadViewerGroups();
            };

            service.addUserToBannedGroup = function(username) {
                if (username != null && username !== "") {
                    service.getBannedGroup().users.push(username);
                }
                saveBannedGroup();

                // Send to backend to be banned.
                ipcRenderer.send('bannedUser', username);
            };

            service.removeUserFromBannedGroupAtIndex = function(index) {
                service.getBannedGroup().users.splice(index, 1);
                saveBannedGroup();
            };

            service.getBannedGroup = function() {
                ensureBannedGroupExists();
                let group = _.findWhere(groups, {groupName: "banned"});
                return group;
            };

            /**
            * Exempt Usergroup Methods
            */

            service.addUserToExemptGroup = function(username) {
                if (username != null && username !== "") {
                    service.getExemptGroup().users.push(username);
                }
                saveExemptGroup();
                listenerService.fireEvent(listenerService.EventType.SPARK_EXEMPT_UPDATED);
            };

            service.removeUserFromExemptGroupAtIndex = function(index) {
                service.getExemptGroup().users.splice(index, 1);
                saveExemptGroup();
                listenerService.fireEvent(listenerService.EventType.SPARK_EXEMPT_UPDATED);
            };

            service.updateExemptViewerGroups = function(groups) {
                service.getExemptGroup().groups = groups;
                saveExemptGroup();
                listenerService.fireEvent(listenerService.EventType.SPARK_EXEMPT_UPDATED);
            };

            service.getExemptGroup = function() {
                ensureExemptGroupExists();
                let group = _.findWhere(sparkExemptGroup, {groupName: "sparkExempt"});
                if (group.groups == null) {
                    group.groups = [];
                }
                return group;
            };

            return service;
        });
}());
