import { TypedEmitter } from "tiny-typed-emitter";
import { JsonDB } from "node-json-db";
import { DateTime } from "luxon";

import { CommandDefinition, SystemCommand, SystemCommandDefinition } from "../../../types/commands";
import logger from "../../logwrapper";
import util from "../../utility";
import profileManager from "../../common/profile-manager";
import frontendCommunicator from "../../common/frontend-communicator";
import accountAccess from "../../common/account-access";

type Events = {
    "created-item": (item: object) => void;
    "updated-item": (item: object) => void;
    "deleted-item": (item: object) => void;
    "systemCommandRegistered": (item: SystemCommand) => void;
    "systemCommandUnRegistered": (id: string) => void;
};

interface SystemCommandOverrides {
    [overrideId: string]: SystemCommandDefinition
}

interface CommandCache {
    systemCommandOverrides: SystemCommandOverrides;
    customCommands: CommandDefinition[];
}

/**
 * The class for the manager object that maintains Firebot system/custom chat commands
 */
class CommandManager extends TypedEmitter<Events> {
    private _registeredSysCommands: SystemCommand[] = [];
    private _commandCache: CommandCache = {
        systemCommandOverrides: {},
        customCommands: []
    };

    constructor() {
        super();

        this.refreshCommandCache();
    }

    private getCommandsDb(): JsonDB {
        return profileManager.getJsonDbInProfile("/chat/commands");
    }

    /**
     * Registers a system command
     *
     * @param command The system command to register
     */
    registerSystemCommand(command: SystemCommand): void {
        // TODO: validate command

        // Steps:
        // Load saved info (ie active, trigger override, etc)
        // Apply saved info

        command.definition.type = "system";

        // default base cmd to active
        if (command.definition.active == null) {
            command.definition.active = true;
        }

        // default sub cmds to active
        if (command.definition.subCommands &&
            command.definition.subCommands.length > 0) {

            command.definition.subCommands.forEach((sc) => {
                if (sc.active == null) {
                    sc.active = true;
                }
            });

        }

        this._registeredSysCommands.push(command);

        this.emit("created-item", command);

        logger.debug(`Registered Sys Command ${command.definition.id}`);

        this.emit("systemCommandRegistered", command);
    }

    /**
     * Unregisters a system command
     *
     * @param id The ID of the system command to unregister
     */
    unregisterSystemCommand(id: string): void {
        const command = this._registeredSysCommands.find(c => c.definition.id === id);
        this._registeredSysCommands = this._registeredSysCommands.filter(c => c.definition.id !== id);

        this.emit("deleted-item", command);
        this.emit("systemCommandUnRegistered", id);
        logger.debug(`Unregistered Sys Command ${id}`);
    }

    /**
     * Gets a system command that matches the given ID
     *
     * @param id The ID of the system command to retrieve
     * @returns The cached `SystemCommand` object that matches the given ID, or `null` if there is no matching system command
     */
    getSystemCommandById(id: string): SystemCommand {
        return util.deepClone(this._registeredSysCommands.find(c => c.definition.id === id));
    }

    /**
     * Gets the trigger for the system command that matches the given ID
     *
     * @param id The ID of the system command
     * @returns The trigger for the cached system command that matches the given ID, or `null` if there is no matching system command
     */
    getSystemCommandTrigger(id: string): string {
        const sysCommandsWithOverrides = this.getAllSystemCommandDefinitions();
        const command = sysCommandsWithOverrides.find(sc => sc.id === id);
        return command ? command.trigger : null;
    }

    /**
     * Returns whether or not a given system command is in the cache
     *
     * @param id The ID of the system command
     * @returns `true` if the system command exists in the cache, or `false` if it doesn't
     */
    hasSystemCommand(id: string): boolean {
        return this._registeredSysCommands.some(c => c.definition.id === id);
    }

    /**
     * Returns all cached system commands
     *
     * @returns An array of all cached `SystemCommand` objects
     */
    getSystemCommands(): SystemCommand[] {
        return util.deepClone(this._registeredSysCommands.map((c) => {
            c.definition.type = "system";
            return c;
        }));
    }

    /**
     * Returns the definitions of all cached system commands
     *
     * @returns An array of `SystemCommandDefinition` objects for all cached system commands
     */
    getAllSystemCommandDefinitions(): SystemCommandDefinition[] {
        const cmdDefs = this._registeredSysCommands.map((c) => {
            const override = this._commandCache.systemCommandOverrides[c.definition.id];
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

                const alwaysUseDefaultProps: Array<keyof typeof override> = [
                    "description",
                    "name"
                ];
                for (const prop of alwaysUseDefaultProps) {
                    if (c.definition[prop] != null) {
                        (override as unknown)[prop] = c.definition[prop];
                    }
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

        return util.deepClone(cmdDefs);
    }

    /**
     * Gets a custom command
     *
     * @param id The ID of the custom command
     * @returns The cached `CommandDefinition` object for the given custom command
     */
    getCustomCommandById(id: string): CommandDefinition {
        return util.deepClone(this._commandCache.customCommands.find(c => c.id === id));
    }

    /**
     * Gets all custom commands in the cache
     *
     * @returns An array of all cached `CommandDefinition` objects
     */
    getAllCustomCommands(): CommandDefinition[] {
        // Deep copy so we don't pollute the cache
        return util.deepClone(this._commandCache.customCommands);
    }

    /**
     * Gets the definitions for all active system and custom commands in the cache
     *
     * @returns An array of `CommandDefinition` objects for all active system and custom commands in the cache
     */
    getAllActiveCommands(): CommandDefinition[] {
        return this.getAllSystemCommandDefinitions()
            .filter(c => c.active)
            .concat(this.getAllCustomCommands()
                .filter(c => c.active));
    }

    /**
     * Returns whether or not the given trigger is already in use on an active command
     *
     * @param trigger The trigger to check if it's taken
     * @returns `true` if the given trigger is already in use for an active command in the cache, or `false` otherwise
     */
    triggerIsTaken(trigger: string): boolean {
        return this.getAllActiveCommands()
            .some(c => c.trigger.toLowerCase() === trigger.toLowerCase());
    }

    /**
     * Forces an update to a system command trigger even if the user has saved an override of the default trigger
     *
     * @param id The ID of the system command
     * @param newTrigger The new trigger for the given system command
     */
    forceUpdateSysCommandTrigger(id: string, newTrigger: string): void {
        const override = this._commandCache.systemCommandOverrides[id];
        if (override != null) {
            override.trigger = newTrigger;
            this.saveSystemCommandOverride(override, false);
        }

        const defaultCmd = this._registeredSysCommands.find(
            c => c.definition.id === id
        );
        if (defaultCmd != null) {
            defaultCmd.definition.trigger = newTrigger;
            this.emit("updated-item", defaultCmd);
        }

        frontendCommunicator.send("system-commands-updated");
    }

    /**
     * Saves a system command override
     *
     * @param command The `SystemCommandDefinition` with the system command override data
     */
    saveSystemCommandOverride(command: SystemCommandDefinition, fireEvent = true): void {
        this._commandCache.systemCommandOverrides[command.id] = command;

        const commandDb = this.getCommandsDb();

        // remove forward slashes just in case
        const id = command.id.replace("/", "");

        try {
            commandDb.push(`/systemCommandOverrides/${id}`, command);

            if (fireEvent) {
                this.emit("updated-item", command);
            }
        } catch (err) { }

        frontendCommunicator.send("system-command-override-saved", command);
    }

    /**
     * Removes the override for a given system command
     *
     * @param id The ID of the system command for which to remove the override
     */
    removeSystemCommandOverride(id: string): void {
        delete this._commandCache.systemCommandOverrides[id];

        const commandDb = this.getCommandsDb();

        // remove forward slashes just in case
        id = id.replace("/", "");
        try {
            commandDb.delete(`/systemCommandOverrides/${id}`);
            const command = this.getSystemCommandById(id);
            this.emit("updated-item", command);
        } catch (err) {} //eslint-disable-line no-empty

        frontendCommunicator.send("system-commands-updated");
    }

    /**
     * Saves a new custom command, or overwrites an existing custom command.
     *
     * To create a new custom command, set the `command` parameter's `id` property to an empty string or `null`.
     * To overwrite an existing custom command, specify the `id` property.
     *
     * @param command The `CommandDefinition` for the custom command
     * @param user The user who is creating/editing the custom command
     */
    saveCustomCommand(command: CommandDefinition, user?: string): void {
        let eventType: keyof Events = "updated-item";
        if (command.id == null || command.id === "") {
            eventType = "created-item";
            // generate id for new command
            const uuidv1 = require("uuid/v1");
            command.id = uuidv1();

            command.createdBy = user
                ? user
                : accountAccess.getAccounts().streamer.username;
            command.createdAt = DateTime.now().toISO();
        } else {
            command.lastEditBy = user
                ? user
                : accountAccess.getAccounts().streamer.username;
            command.lastEditAt = DateTime.now().toISO();
        }

        if (command.count == null) {
            command.count = 0;
        }

        command.type = "custom";

        const commandDb = this.getCommandsDb();

        try {
            commandDb.push(`/customCommands/${command.id}`, command);
            this.emit(eventType, command);
        } catch (err) {}

        const existingCommandIndex = this._commandCache.customCommands.findIndex(c => c.id === command.id);
        if (existingCommandIndex === -1) {
            this._commandCache.customCommands.push(command);
        } else {
            this._commandCache.customCommands[existingCommandIndex] = command;
        }

        frontendCommunicator.send("custom-command-saved", command);
    }

    /**
     * Imports a custom command, like from a setup or a previous version of Firebot
     *
     * @param command The `CommandDefinition` for the custom command to import
     */
    saveImportedCustomCommand(command: CommandDefinition): void {
        logger.debug(`Saving imported command: ${command.trigger}`);

        if (command.id == null || command.id === "") {
            command.createdBy = "Imported";
        } else {
            command.lastEditBy = "Imported";
        }

        this.saveCustomCommand(command, "Imported");
    }

    /**
     * Saves all the specified custom commands
     *
     * @param commands An array of `CommandDefinition` objects to save
     */
    saveAllCustomCommands(commands: CommandDefinition[]): void {
        try {
            const commandDb = this.getCommandsDb();
            const customCommandsObj = commands.reduce((acc, command) => {
                acc[command.id] = command;
                return acc;
            }, {});
            commandDb.push("/customCommands", customCommandsObj);
        } catch (err) {}

        this._commandCache.customCommands = commands;

        frontendCommunicator.send("custom-commands-updated");
    }

    /**
     * Deletes a custom command
     *
     * @param id ID of the custom command to delete
     */
    deleteCustomCommand(id: string): void {
        const commandDb = this.getCommandsDb();

        if (id == null) {
            return;
        }

        try {
            const command = this.getCustomCommandById(id);
            commandDb.delete(`/customCommands/${id}`);
            this.emit("deleted-item", command);
        } catch (err) {
            logger.warn("error when deleting command", err.message);
        }

        this._commandCache.customCommands = this._commandCache.customCommands.filter(c => c.id !== id);

        frontendCommunicator.send("custom-command-deleted", id);
    }

    /**
     * Deletes a custom command by its trigger
     *
     * @param trigger The trigger of the custom command to delete
     */
    removeCustomCommandByTrigger(trigger: string): void {
        const command = this._commandCache.customCommands.find(c => c.trigger === trigger);
        if (command != null) {
            this.deleteCustomCommand(command.id);
        }
    }

    /**
     * Refreshes the command cache
     */
    refreshCommandCache(): void {
        // Get commands file
        const commandsDb = this.getCommandsDb();

        if (commandsDb != null) {
            const cmdData: CommandCache = commandsDb.getData("/");

            if (cmdData.systemCommandOverrides) {
                this._commandCache.systemCommandOverrides = cmdData.systemCommandOverrides;
            }

            if (cmdData.customCommands) {
                this._commandCache.customCommands = Object.values(
                    cmdData.customCommands
                ).map((c) => {
                    c.type = "custom";
                    return c;
                });
            }

            logger.info("Updated Command cache.");
        }
    }

    /**
     * Triggers a refresh of the frontend copy of the command cache
     */
    triggerUiRefresh() {
        frontendCommunicator.send("custom-commands-updated");
    }
}

/**
 * The Firebot system/custom chat command manager
 */
const manager = new CommandManager();

frontendCommunicator.on("get-all-system-commands", () => {
    logger.info("got 'get all cmds' request");
    return manager.getSystemCommands();
});

frontendCommunicator.on("get-all-system-command-definitions", () => {
    logger.info("got 'get all cmd defs' request");
    return manager.getAllSystemCommandDefinitions();
});

frontendCommunicator.on("get-system-command", (commandId: string) => {
    logger.info("got 'get cmd' request", commandId);
    return manager.getSystemCommandById(commandId);
});

frontendCommunicator.on("save-system-command-override", (sysCommand: SystemCommandDefinition) => {
    logger.info("got 'save sys cmd' request");
    manager.saveSystemCommandOverride(sysCommand);
});

frontendCommunicator.on("remove-system-command-override", (id: string) => {
    logger.info("got 'remove sys cmd' request");
    manager.removeSystemCommandOverride(id);
});

frontendCommunicator.on("get-all-custom-commands", () => {
    return manager.getAllCustomCommands();
});

frontendCommunicator.on("save-custom-command", (commandData: { command: CommandDefinition, user: string }) => {
    manager.saveCustomCommand(commandData.command, commandData.user);
});

frontendCommunicator.on("save-all-custom-commands", (commands: CommandDefinition[]) => {
    manager.saveAllCustomCommands(commands);
});

frontendCommunicator.on("delete-custom-command", (id: string) => {
    manager.deleteCustomCommand(id);
});

frontendCommunicator.on("get-all-commands", () => {
    return {
        customCommands: manager.getAllCustomCommands(),
        systemCommands: manager.getAllSystemCommandDefinitions()
    };
});

export = manager;