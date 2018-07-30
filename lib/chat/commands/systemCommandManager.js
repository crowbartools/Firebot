"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const EventEmitter = require("events");

class SystemCommandManager extends EventEmitter {
  constructor() {
    super();
    this._registeredCommands = [];
  }

  registerCommand(command) {
    // TODO: validate command

    // Steps:
    // Load saved info (ie active, trigger override, etc)
    // Apply saved info
    // Check if any commands already have defined trigger. If so, disable command.

    this._registeredCommands.push(command);

    logger.debug(`Registered Command ${command.id}`);

    this.emit("commandRegistered", command);
  }

  getCommandById(id) {
    return this._registeredCommands.find(c => c.definition.id === id);
  }

  getSystemCommands() {
    return this._registeredCommands.map(c => {
      c.type = "system";
      return c;
    });
  }

  getAllCommandDefinitions() {
    return this._registeredCommands.map(c => c.definition);
  }
}

const manager = new SystemCommandManager();

ipcMain.on("getAllSystemCommands", event => {
  logger.info("got 'get all cmds' request");
  event.returnValue = manager._registeredCommands;
});

ipcMain.on("getCommand", (event, commandId) => {
  logger.info("got 'get cmd' request", commandId);
  event.returnValue = manager.getCommandById(commandId);
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
