"use strict";
(function() {
  //This manages command data
  const profileManager = require("../../lib/common/profile-manager.js");

  angular.module("firebotApp").factory("commandsService", function(logger) {
    let service = {};

    let getCommandsDb = () =>
      profileManager.getJsonDbInProfile("/chat/commands");

    // in memory commands storage
    let commandsCache = {
      systemCommands: [],
      customCommands: [],
      timers: []
    };

    // Refresh commands cache
    service.refreshCommands = function() {
      let commandsDb = getCommandsDb();

      let cmdData;
      try {
        cmdData = commandsDb.getData("/");
      } catch (err) {
        logger.warning("error getting command data", err);
        return;
      }

      if (cmdData.systemCommands) {
        commandsCache.systemCommands = Object.values(cmdData.systemCommands);

        // TODO: Add and save any system command entries that should exist but dont.
        // Should only happen when we introduce a new system command or someone messes with the json
      }

      if (cmdData.customCommands) {
        commandsCache.customCommands = Object.values(cmdData.customCommands);
      }

      if (cmdData.timers) {
        commandsCache.timers = Object.values(cmdData.timers);
      }

      // Refresh the interactive control cache.
      ipcRenderer.send("refreshCommandCache");
    };

    service.getSystemCommands = () => commandsCache.systemCommands;

    service.getCustomCommands = () => commandsCache.customCommands;

    service.getTimers = () => commandsCache.timers;

    // Saves out a command
    service.saveCommand = function(command) {
      let commandDb = getCommandsDb();

      // Note(ebiggz): Angular sometimes adds properties to objects for the purposes of two way bindings
      // and other magical things. Angular has a .toJson() convienence method that coverts an object to a json string
      // while removing internal angular properties. We then convert this string back to an object with
      // JSON.parse. It's kinda hacky, but it's an easy way to ensure we arn't accidentally saving anything extra.
      let cleanedCommands = JSON.parse(angular.toJson(command));

      // If the command is active, throw it into the active group. Otherwise put it in the inactive group.
      if (command.active === true) {
        logger.info("Saving " + command.commandID + " to active");
        try {
          commandDb.delete("/Inactive/" + command.commandID);
        } catch (err) {} //eslint-disable-line no-empty
        commandDb.push("/Active/" + command.commandID, cleanedCommands);
      } else {
        logger.info("Saving " + command.commandID + " to inactive");
        try {
          commandDb.delete("/Active/" + command.commandID);
        } catch (err) {} //eslint-disable-line no-empty
        commandDb.push("/Inactive/" + command.commandID, cleanedCommands);
      }
    };

    // Deletes a command.
    service.deleteCommand = function(command) {
      let commandDb = profileManager.getCommandsDb();
      let cleanedCommands = JSON.parse(angular.toJson(command));

      if (cleanedCommands.active === true) {
        commandDb.delete("./Active/" + cleanedCommands.commandID);
      } else {
        commandDb.delete("./Inactive/" + cleanedCommands.commandID);
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
      let commandDb = profileManager.getJsonDbInProfile("/chat/commands");
      try {
        commandDb.push("./timedGroups/" + timedGroup.groupName, timedGroup);
      } catch (err) {
        logger.error(err);
      }

      // Check to see if we are renaming a group and need to remove the old one.
      if (
        previousGroupName !== timedGroup.groupName &&
        previousGroupName != null &&
        previousGroupName !== ""
      ) {
        try {
          commandDb.delete("./timedGroups/" + previousGroupName);
        } catch (err) {
          logger.error(err);
        }
      }
    };

    // Delete timed Group
    service.deleteTimedGroup = function(previousGroupName, timedGroup) {
      let commandDb = profileManager.getJsonDbInProfile("/chat/commands");
      try {
        commandDb.delete("./timedGroups/" + previousGroupName);
      } catch (err) {
        logger.error(err);
      }

      try {
        commandDb.delete("./timedGroups/" + timedGroup.groupName);
      } catch (err) {
        logger.error(err);
      }
    };

    return service;
  });
})();
