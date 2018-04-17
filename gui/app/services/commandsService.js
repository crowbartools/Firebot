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

    service.saveCustomCommand = function(command) {
      let commandDb = getCommandsDb();

      // Note(ebiggz): Angular sometimes adds properties to objects for the purposes of two way bindings
      // and other magical things. Angular has a .toJson() convienence method that coverts an object to a json string
      // while removing internal angular properties. We then convert this string back to an object with
      // JSON.parse. It's kinda hacky, but it's an easy way to ensure we arn't accidentally saving anything extra.
      let cleanedCommand = JSON.parse(angular.toJson(command));

      try {
        commandDb.push("/customCommands/" + command.id, cleanedCommand);
      } catch (err) {} //eslint-disable-line no-empty
    };

    service.saveSystemCommand = function(command) {
      let commandDb = getCommandsDb();

      let cleanedCommand = JSON.parse(angular.toJson(command));

      try {
        commandDb.push("/systemCommands/" + command.id, cleanedCommand);
      } catch (err) {} //eslint-disable-line no-empty
    };

    service.saveTimer = function(timer) {
      let commandDb = getCommandsDb();

      let cleanedTimer = JSON.parse(angular.toJson(timer));

      try {
        commandDb.push("/timers/" + cleanedTimer.id, cleanedTimer);
      } catch (err) {} //eslint-disable-line no-empty
    };

    // Deletes a command.
    service.deleteCustomCommand = function(command) {
      let commandDb = getCommandsDb();

      if (command == null) return;

      try {
        commandDb.delete("/customCommands/" + command.id);
      } catch (err) {
        logger.warn("error when deleting command", err);
      } //eslint-disable-line no-empty
    };

    // Deletes a command.
    service.deleteTimer = function(timer) {
      let commandDb = getCommandsDb();

      if (timer == null) return;

      try {
        commandDb.delete("/timers/" + timer.id);
      } catch (err) {
        logger.warn("error when deleting timer", err);
      } //eslint-disable-line no-empty
    };

    return service;
  });
})();
