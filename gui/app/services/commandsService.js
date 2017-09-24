(function(){
  
 //This manages command data
 
 const fs = require('fs');
 const _ = require('underscore')._; 
 const dataAccess = require('../../lib/data-access.js');
 
 angular
    .module('firebotApp')
    .factory('commandsService', function ($http, $q, settingsService, $rootScope, utilityService) {
        var service = {};

        // in memory commands storage
        var commandsCache = {};

        // Refresh commands cache
        service.refreshCommands = function() {
            var commandsDb = dataAccess.getJsonDbInUserData("/user-settings/chat/commands");
            commandsCache = commandsDb.getData('/');
        }

        // Get an array of command types.
        service.getCommandTypes = function(){
            var commandTypes = [];
            if (commandsCache != null) {
                commandTypes = Object.keys(commandsCache);
            }
            return commandTypes;
        }

        // Return all commands for a specific command type.
        service.getAllCommandsForType = function(commandType){
            return commandsCache[commandType];
        }

        return service;
    });    
})();
