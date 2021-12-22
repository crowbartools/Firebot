"use strict";
(function() {
    //This manages command data
    const profileManager = require("../../backend/common/profile-manager.js");

    angular
        .module("firebotApp")
        .factory("commandsService", function(
            logger,
            connectionService,
            listenerService,
            backendCommunicator
        ) {
            let service = {};

            service.customCommandSearch = "";

            let getCommandsDb = () =>
                profileManager.getJsonDbInProfile("/chat/commands");

            // in memory commands storage
            service.commandsCache = {
                systemCommands: [],
                customCommands: []
            };

            const updateCustomCommands = (command) => {
                const index = service.commandsCache.customCommands.findIndex(c => c.id === command.id);
                if (index > -1) {
                    service.commandsCache.customCommands[index] = command;
                } else {
                    service.commandsCache.customCommands.push(command);
                }
            };

            // Refresh commands cache
            service.refreshCommands = function() {
                let commandsDb = getCommandsDb();

                let cmdData;
                try {
                    cmdData = commandsDb.getData("/");
                } catch (err) {
                    logger.warn("error getting command data", err);
                    return;
                }

                if (cmdData.customCommands) {
                    logger.debug("loading custom commands: " + cmdData.customCommands);
                    service.commandsCache.customCommands = Object.values(cmdData.customCommands);
                }

                service.commandsCache.systemCommands = listenerService.fireEventSync(
                    "getAllSystemCommandDefinitions"
                );

                // Refresh the command cache.
                ipcRenderer.send("refreshCommandCache");
            };

            backendCommunicator.on("custom-commands-updated", () => {
                service.refreshCommands();
            });

            service.getSystemCommands = () => service.commandsCache.systemCommands;

            service.getCustomCommands = () => service.commandsCache.customCommands;

            service.saveCustomCommand = async (customCommand, user = null) => {
                if (user == null) {
                    user = connectionService.accounts.streamer.username;
                }

                const savedCommand = await backendCommunicator.fireEventAsync("saveCustomCommand", {customCommand, user});

                if (savedCommand != null) {
                    updateCustomCommands(savedCommand);
                }
            };

            service.saveAllCustomCommands = (commands) => {
                service.commandsCache.customCommands = commands;
                backendCommunicator.fireEvent("saveAllCustomCommands", commands);
            };

            service.saveSystemCommandOverride = function(command) {
                listenerService.fireEvent(
                    "saveSystemCommandOverride",
                    JSON.parse(angular.toJson(command))
                );

                let index = service.commandsCache.systemCommands.findIndex(
                    c => c.id === command.id
                );

                service.commandsCache.systemCommands[index] = command;
            };

            service.triggerExists = function(trigger, id = null) {
                if (trigger == null) return false;

                trigger = trigger != null ? trigger.toLowerCase() : "";

                let foundDuplicateCustomCmdTrigger = service.commandsCache.customCommands.some(
                    command =>
                        command.id !== id && command.trigger && command.trigger.toLowerCase() === trigger
                );

                let foundDuplicateSystemCmdTrigger = service.commandsCache.systemCommands.some(
                    command => command.active && command.trigger && command.trigger.toLowerCase() === trigger
                );

                return foundDuplicateCustomCmdTrigger || foundDuplicateSystemCmdTrigger;
            };

            service.deleteCustomCommand = (commandId) => {
                service.commandsCache.customCommands = service.commandsCache.customCommands.filter(c => c.id !== commandId);
                backendCommunicator.fireEvent("deleteCustomCommand", commandId);
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
}());
