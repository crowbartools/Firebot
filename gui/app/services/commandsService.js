'use strict';
(function() {

    //This manages command data

    const dataAccess = require('../../lib/common/data-access.js');

    angular
        .module('firebotApp')
        .factory('commandsService', function (logger) {
            let service = {};

            // in memory commands storage
            let commandsCache = {};
            let timedGroupsCache = {};

            // Refresh commands cache
            service.refreshCommands = function() {
                let commandsDb = dataAccess.getJsonDbInUserData("/user-settings/chat/commands");
                commandsCache = commandsDb.getData('/');

                try {
                    timedGroupsCache = commandsDb.getData('/timedGroups');
                } catch (err) {
                    timedGroupsCache = {};
                }

                // Refresh the interactive control cache.
                ipcRenderer.send('refreshCommandCache');

            };

            // Get an array of command types. Filters out timed groups list.
            service.getCommandTypes = function() {
                let commandTypes = [];
                if (commandsCache != null) {
                    commandTypes = Object.keys(commandsCache).filter(key => {
                        return key !== 'timedGroups';
                    });
                }
                return commandTypes;
            };

            // Return all commands for a specific command type.
            service.getAllCommandsForType = function(commandType) {
                let commandArray = [];
                if (commandsCache != null) {
                    let commands = commandsCache[commandType];
                    for (let command in commands) {
                        if (commands.hasOwnProperty(command)) {
                            commandArray.push(commands[command]);
                        }
                    }
                }
                return commandArray;
            };

            service.getAllCommands = function() {
                let commands = [];
                Object.values(commandsCache).forEach(t => {
                    commands = commands.concat(Object.values(t));
                });
                return commands;
            };

            service.getCommandRoles = function(command) {
                let commandRoles = command.permissions;
                let final = [];
                if (commandRoles != null) {
                    if (commandRoles instanceof Array) {
                        final = commandRoles;
                    } else {
                        final.push(commandRoles);
                    }
                }
                return final;
            };

            // Saves out a command
            service.saveCommand = function(command) {
                let commandDb = dataAccess.getJsonDbInUserData("/user-settings/chat/commands");

                // Note(ebiggz): Angular sometimes adds properties to objects for the purposes of two way bindings
                // and other magical things. Angular has a .toJson() convienence method that coverts an object to a json string
                // while removing internal angular properties. We then convert this string back to an object with
                // JSON.parse. It's kinda hacky, but it's an easy way to ensure we arn't accidentally saving anything extra.
                let cleanedCommands = JSON.parse(angular.toJson(command));

                // If the command is active, throw it into the active group. Otherwise put it in the inactive group.
                if (command.active === true) {
                    logger.info('Saving ' + command.commandID + ' to active');
                    try {
                        commandDb.delete("/Inactive/" + command.commandID);
                    } catch (err) {} //eslint-disable-line no-empty
                    commandDb.push("/Active/" + command.commandID, cleanedCommands);
                } else {
                    logger.info('Saving ' + command.commandID + ' to inactive');
                    try {
                        commandDb.delete("/Active/" + command.commandID);
                    } catch (err) {} //eslint-disable-line no-empty
                    commandDb.push("/Inactive/" + command.commandID, cleanedCommands);
                }
            };

            // Deletes a command.
            service.deleteCommand = function(command) {
                let commandDb = dataAccess.getJsonDbInUserData("/user-settings/chat/commands");
                let cleanedCommands = JSON.parse(angular.toJson(command));

                if (cleanedCommands.active === true) {
                    commandDb.delete('./Active/' + cleanedCommands.commandID);
                } else {
                    commandDb.delete('./Inactive/' + cleanedCommands.commandID);
                }
            };

            ///////////////
            // Timed Groups
            ///////////////

            // Gets the cached timed groups
            service.getTimedGroupSettings = function() {
                return timedGroupsCache;
            };

            // Save Timed Group
            service.saveTimedGroup = function(previousGroupName, timedGroup) {
                let commandDb = dataAccess.getJsonDbInUserData("/user-settings/chat/commands");
                try {
                    commandDb.push('./timedGroups/' + timedGroup.groupName, timedGroup);
                } catch (err) {
                    logger.error(err);
                }

                // Check to see if we are renaming a group and need to remove the old one.
                if (previousGroupName !== timedGroup.groupName && previousGroupName != null && previousGroupName !== "") {
                    try {
                        commandDb.delete('./timedGroups/' + previousGroupName);
                    } catch (err) {
                        logger.error(err);
                    }
                }
            };

            // Delete timed Group
            service.deleteTimedGroup = function(previousGroupName, timedGroup) {
                let commandDb = dataAccess.getJsonDbInUserData("/user-settings/chat/commands");
                try {
                    commandDb.delete('./timedGroups/' + previousGroupName);
                } catch (err) {
                    logger.error(err);
                }

                try {
                    commandDb.delete('./timedGroups/' + timedGroup.groupName);
                } catch (err) {
                    logger.error(err);
                }
            };

            return service;
        });
}());
