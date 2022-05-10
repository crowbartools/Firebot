"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const EventEmitter = require("events");
const commandAccess = require("./command-access");

class CommandManager extends EventEmitter {
    constructor() {
        super();

        this._registeredSysCommands = [];
        this._sysCommandOverrides = commandAccess.getSystemCommandOverrides();

        if (this._sysCommandOverrides == null) {
            this._sysCommandOverrides = {};
        }

        this.CommandType = { SYSTEM: "system", CUSTOM: "custom" };
    }

    registerSystemCommand(command) {
        // TODO: validate command

        // Steps:
        // Load saved info (ie active, trigger override, etc)
        // Apply saved info

        command.definition.type = this.CommandType.SYSTEM;

        // default base cmd to active
        if (command.definition.active == null) {
            command.definition.active = true;
        }

        // default sub cmds to active
        if (command.definition.subCommands &&
            command.definition.subCommands.length > 0) {

            command.definition.subCommands.forEach(sc => {
                if (sc.active == null) {
                    sc.active = true;
                }
            });

        }

        this._registeredSysCommands.push(command);

        logger.debug(`Registered Sys Command ${command.definition.id}`);

        this.emit("systemCommandRegistered", command);
    }

    /**
     * Unregisters a system command.
     * @param {*} id
     */
    unregisterSystemCommand(id) {
        this._registeredSysCommands = this._registeredSysCommands.filter(c => c.definition.id !== id);
        this.emit("systemCommandUnRegistered", id);
        logger.debug(`Unregistered Sys Command ${id}`);
    }

    getSystemCommandById(id) {
        return this._registeredSysCommands.find(c => c.definition.id === id);
    }

    getSystemCommandTrigger(id) {
        const sysCommandsWithOverrides = this.getAllSystemCommandDefinitions();
        const command = sysCommandsWithOverrides.find(sc => sc.id === id);
        return command ? command.trigger : null;
    }

    hasSystemCommand(id) {
        return this._registeredSysCommands.some(c => c.definition.id === id);
    }

    getSystemCommands() {
        return this._registeredSysCommands.map(c => {
            c.definition.type = "system";
            return c;
        });
    }

    getAllSystemCommandDefinitions() {
        const cmdDefs = this._registeredSysCommands.map(c => {
            const override = this._sysCommandOverrides[c.definition.id];
            if (override != null) {
                if (c.definition.options) {
                    override.options = Object.assign(c.definition.options, override.options);

                    //remove now nonexistent options
                    for (const overrideOptionName of Object.keys(override.options)) {
                        if (c.definition.options[overrideOptionName] == null) {
                            delete override.options[overrideOptionName];
                        }
                    }
                } else {
                    override.options = null;
                }

                if (c.definition.baseCommandDescription) {
                    override.baseCommandDescription = c.definition.baseCommandDescription;
                }

                if (c.definition.subCommands) {
                    if (!override.subCommands) {
                        override.subCommands = c.definition.subCommands;
                    } else {
                        //add new args
                        for (const subCommand of c.definition.subCommands) {
                            if (!override.subCommands.some(sc => sc.arg === subCommand.arg)) {
                                override.subCommands.push(subCommand);
                            }
                        }

                        //remove now nonexistent args
                        for (let i = 0; i < override.subCommands.length; i++) {
                            const overrideSubCommand = override.subCommands[i];
                            if (!c.definition.subCommands.some(sc => sc.arg === overrideSubCommand.arg)) {
                                override.subCommands.splice(i, 1);
                            }
                        }
                    }

                } else {
                    override.subCommands = [];
                }

                return override;
            }
            return c.definition;
        });

        return cmdDefs;
    }

    getCustomCommandById(id) {
        return commandAccess.getCustomCommands().find(c => c.id === id);
    }

    getAllCustomCommands() {
        return commandAccess.getCustomCommands();
    }

    getAllActiveCommands() {
        return this.getAllSystemCommandDefinitions()
            .filter(c => c.active)
            .concat(this.getAllCustomCommands()
                .filter(c => c.active));
    }

    triggerIsTaken(trigger) {
        return this.getAllActiveCommands()
            .find(c => c.trigger.toLowerCase() === trigger.toLowerCase());
    }

    // this updates the trigger even if the user has saved an override of the default trigger
    forceUpdateSysCommandTrigger(id, newTrigger) {
        const override = this._sysCommandOverrides[id];
        if (override != null) {
            override.trigger = newTrigger;
            this.saveSystemCommandOverride(override);
        }

        const defaultCmd = this._registeredSysCommands.find(
            c => c.definition.id === id
        );
        if (defaultCmd != null) {
            defaultCmd.definition.trigger = newTrigger;
        }

        renderWindow.webContents.send("systemCommandsUpdated");
    }

    //saves a system command override
    saveSystemCommandOverride(sysCommand) {
        this._sysCommandOverrides[sysCommand.id] = sysCommand;
        commandAccess.saveSystemCommandOverride(sysCommand);
    }

    saveCustomCommand(command, user, isNew = true) {
        renderWindow.webContents.send("saveCustomCommand", { command: command, user: user, newCommand: isNew });
    }

    removeCustomCommandByTrigger(trigger) {
        renderWindow.webContents.send("removeCustomCommandByTrigger", { trigger: trigger });
    }
}

const manager = new CommandManager();

ipcMain.on("getAllSystemCommands", event => {
    logger.info("got 'get all cmds' request");
    event.returnValue = manager.getSystemCommands();
});

ipcMain.on("getAllSystemCommandDefinitions", event => {
    logger.info("got 'get all cmd defs' request");
    event.returnValue = manager.getAllSystemCommandDefinitions();
});

ipcMain.on("getSystemCommand", (event, commandId) => {
    logger.info("got 'get cmd' request", commandId);
    event.returnValue = manager.getSystemCommandById(commandId);
});

ipcMain.on("saveSystemCommandOverride", (event, sysCommand) => {
    logger.info("got 'save sys cmd' request");
    manager.saveSystemCommandOverride(sysCommand);
});

ipcMain.on("removeSystemCommandOverride", (event, id) => {
    logger.info("got 'remove sys cmd' request");
    delete manager._sysCommandOverrides[id];
    commandAccess.removeSystemCommandOverride(id);
    renderWindow.webContents.send("systemCommandsUpdated");
});

module.exports = manager;
