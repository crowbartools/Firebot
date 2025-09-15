"use strict";
(function() {
    angular
        .module("firebotApp")
        .factory("commandsService", function(
            logger,
            backendCommunicator,
            ngToast
        ) {
            const service = {};

            service.customCommandSearch = "";

            // in memory commands storage
            service.commandsCache = {
                systemCommands: [],
                customCommands: []
            };

            // Refresh commands cache
            service.refreshCommands = function() {
                service.commandsCache = backendCommunicator.fireEventSync("get-all-commands");
            };

            backendCommunicator.on("system-commands-updated", () => {
                service.refreshCommands();
            });

            backendCommunicator.on("custom-commands-updated", () => {
                service.refreshCommands();
            });

            service.getSystemCommands = () => service.commandsCache.systemCommands;

            service.getCustomCommands = () => service.commandsCache.customCommands;

            service.saveCustomCommand = function(command, user = null) {
                logger.debug(`saving command: ${command.trigger}`);

                // Note(ebiggz): Angular sometimes adds properties to objects for the purposes of two way bindings
                // and other magical things. Angular has a .toJson() convenience method that coverts an object to a json string
                // while removing internal angular properties. We then convert this string back to an object with
                // JSON.parse. It's kinda hacky, but it's an easy way to ensure we aren't accidentally saving anything extra.
                const cleanedCommand = JSON.parse(angular.toJson(command));

                backendCommunicator.send("save-custom-command", {
                    command: cleanedCommand,
                    user: user
                });
            };

            backendCommunicator.on("custom-command-saved", (command) => {
                const currentIndex = service.commandsCache.customCommands.findIndex(c => c.id === command.id);

                if (currentIndex === -1) {
                    service.commandsCache.customCommands.push(command);
                } else {
                    service.commandsCache.customCommands[currentIndex] = command;
                }
            });

            service.saveAllCustomCommands = (commands) => {
                service.commandsCache.customCommands = commands;
                const cleanedCommands = JSON.parse(angular.toJson(commands));

                backendCommunicator.send("save-all-custom-commands", cleanedCommands);
            };

            service.saveSystemCommandOverride = function(command) {
                backendCommunicator.send("save-system-command-override",
                    JSON.parse(angular.toJson(command))
                );
            };

            backendCommunicator.on("system-command-override-saved", (command) => {
                const index = service.commandsCache.systemCommands.findIndex(
                    c => c.id === command.id
                );

                service.commandsCache.systemCommands[index] = command;
            });

            service.triggerExists = function(trigger, id = null) {
                if (trigger == null) {
                    return false;
                }

                trigger = trigger != null ? trigger.toLowerCase() : "";

                const foundDuplicateCustomCmdTrigger = service.commandsCache.customCommands.some(
                    command =>
                        command.id !== id && command.trigger && command.trigger.toLowerCase() === trigger
                );

                const foundDuplicateSystemCmdTrigger = service.commandsCache.systemCommands.some(
                    command => command.active && command.trigger && command.trigger.toLowerCase() === trigger
                );

                return foundDuplicateCustomCmdTrigger || foundDuplicateSystemCmdTrigger;
            };

            // Deletes a command.
            service.deleteCustomCommand = function(command) {
                backendCommunicator.send("delete-custom-command", command.id);
            };

            backendCommunicator.on("custom-command-deleted", (id) => {
                service.commandsCache.customCommands = service.commandsCache.customCommands.filter(c => c.id !== id);
            });

            backendCommunicator.on("command-count-update", ({commandId, count}) => {
                const command = service.getCustomCommands().find(c => c.id === commandId);

                if (command != null) {
                    command.count = count;
                }
            });

            service.resetActiveCooldowns = () => {
                backendCommunicator.send("reset-active-cooldowns");
            };

            service.resetAllPerStreamCommandUsages = () => {
                backendCommunicator.send("reset-all-per-stream-command-usages");
                ngToast.create({
                    className: "success",
                    content: "All per-stream command usages cleared successfully"
                });
            };

            service.resetPerStreamUsagesForCommand = (commandId) => {
                backendCommunicator.send("reset-per-stream-usages-for-command", commandId);
                const command = service.commandsCache.customCommands.find(c => c.id === commandId);
                const toastMessage = command != null
                    ? `Per-stream usages cleared for <strong>${command.trigger}</strong>`
                    : `Per-stream usages cleared`;
                ngToast.create({
                    className: "success",
                    content: toastMessage
                });
            };

            backendCommunicator.on("active-cooldowns-reset", () => {
                ngToast.create({
                    className: "success",
                    content: "All command cooldowns cleared successfully"
                });
            });

            service.resetCooldownsForCommand = (id) => {
                backendCommunicator.send("reset-cooldowns-for-single-command", id);
            };

            backendCommunicator.on("cooldowns-cleared-for-command", (id) => {
                const command = service.commandsCache.customCommands.some(c => c.id === id)
                    ? service.commandsCache.customCommands.find(c => c.id === id)
                    : service.commandsCache.systemCommands.find(c => c.id === id);

                const toastMessage = command != null
                    ? `Cooldowns cleared for <strong>${command.trigger}</strong>`
                    : `Cooldowns cleared`;

                ngToast.create({
                    className: "success",
                    content: toastMessage
                });
            });

            return service;
        });
}());
