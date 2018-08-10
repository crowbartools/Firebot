"use strict";
(function() {
  //This manages command data
  const profileManager = require("../../lib/common/profile-manager.js");
  const moment = require("moment");

  angular
    .module("firebotApp")
    .factory("commandsService", function(
      logger,
      connectionService,
      listenerService
    ) {
      let service = {};

      let getCommandsDb = () =>
        profileManager.getJsonDbInProfile("/chat/commands");

      // in memory commands storage
      let commandsCache = {
        systemCommands: [],
        customCommands: []
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

        if (cmdData.customCommands) {
          logger.debug("loading custom commands: " + cmdData.customCommands);
          commandsCache.customCommands = Object.values(cmdData.customCommands);
        }

        commandsCache.systemCommands = listenerService.fireEventSync(
          "getAllSystemCommandDefinitions"
        );

        // Refresh the interactive command cache.
        ipcRenderer.send("refreshCommandCache");
      };

      service.getSystemCommands = () => commandsCache.systemCommands;

      service.getCustomCommands = () => commandsCache.customCommands;

      service.saveCustomCommand = function(command, createdBy = null) {
        logger.debug("saving command: " + command.trigger);
        if (command.id == null || command.id === "") {
          // generate id for new command
          const uuidv1 = require("uuid/v1");
          command.id = uuidv1();

          command.createdBy = createdBy
            ? createdBy
            : connectionService.accounts.streamer.username;
          command.createdAt = moment().format();
        }

        if (command.count == null) {
          command.count = 0;
        }

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

      service.saveSystemCommandOverride = function(command) {
        listenerService.fireEvent(
          "saveSystemCommandOverride",
          JSON.parse(angular.toJson(command))
        );

        let index = commandsCache.systemCommands.findIndex(
          c => c.id === command.id
        );

        commandsCache.systemCommands[index] = command;
      };

      service.triggerExists = function(trigger, id = null) {
        if (trigger == null) return false;

        trigger = trigger.toLowerCase();

        let foundDuplicateCustomCmdTrigger = commandsCache.customCommands.some(
          command =>
            command.id !== id && command.trigger.toLowerCase() === trigger
        );

        let foundDuplicateSystemCmdTrigger = commandsCache.systemCommands.some(
          command => command.active && command.trigger.toLowerCase() === trigger
        );

        return foundDuplicateCustomCmdTrigger || foundDuplicateSystemCmdTrigger;
      };

      // Deletes a command.
      service.deleteCustomCommand = function(command) {
        let commandDb = getCommandsDb();

        if (command == null || command.id == null || command.id === "") return;

        try {
          commandDb.delete("/customCommands/" + command.id);
        } catch (err) {
          logger.warn("error when deleting command", err);
        } //eslint-disable-line no-empty
      };

      listenerService.registerListener(
        {
          type: listenerService.ListenerType.SYS_CMDS_UPDATED
        },
        () => {
          service.refreshCommands();
        }
      );

      ipcRenderer.on("commandCountUpdate", function(event, data) {
        let command = service
          .getCustomCommands()
          .find(c => c.id === data.commandId);
        if (command != null) {
          command.count = data.count;
          service.saveCustomCommand(command);
        }
      });

      return service;
    });
})();
