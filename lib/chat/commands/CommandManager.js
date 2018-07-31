"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const EventEmitter = require("events");

class CommandManager extends EventEmitter {
  constructor() {
    super();
    this._registeredSysCommands = [];
    this.CommandType = { SYSTEM: "system", CUSTOM: "custom" };
  }

  registerSystemCommand(command) {
    // TODO: validate command

    // Steps:
    // Load saved info (ie active, trigger override, etc)
    // Apply saved info

    this._registeredSysCommands.push(command);
    command.type = this.CommandType.SYSTEM;

    logger.debug(`Registered Sys Command ${command.id}`);

    this.emit("systemCommandRegistered", command);
  }

  getSystemCommandById(id) {
    return this._registeredSysCommands.find(c => c.definition.id === id);
  }

  getSystemCommands() {
    return this._registeredSysCommands.map(c => {
      c.type = "system";
      return c;
    });
  }

  getAllSystemCommandDefinitions() {
    return this._registeredSysCommands.map(c => c.definition);
  }
}

const manager = new CommandManager();

ipcMain.on("getAllSystemCommands", event => {
  logger.info("got 'get all cmds' request");
  event.returnValue = manager._registeredSysCommands;
});

ipcMain.on("getSystemCommand", (event, commandId) => {
  logger.info("got 'get cmd' request", commandId);
  event.returnValue = manager.getSystemCommandById(commandId);
});

module.exports = manager;

/*let command = {
  id: "firebot:listcommands",
  name: "List Commands",
  trigger: "!commands",
  description: "Lists all commands the user has permission to run",
  subCommands: [
    {
      arg: "give",
      usage: "",
      description: "Lists all commands the user has permission to run",
      permissions: {}
    }
  ]
};*/
