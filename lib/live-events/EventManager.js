"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const EventEmitter = require("events");

class EventManager extends EventEmitter {
  constructor() {
    super();

    this._registeredEventSources = [];
  }

  registerEventSource(eventSource) {
    // TODO: validate eventSource

    this._registeredEventSources.push(eventSource);

    logger.debug(`Registered Event Source ${eventSource.id}`);

    this.emit("eventSourceRegistered", eventSource);
  }

  getEventSourceById(id) {
    return this._registeredEventSources.find(es => es.id === id);
  }

  getEventSourceById(id) {
    return this._registeredEventSources.find(es => es.id === id);
  }

  getSystemCommands() {
    return this._registeredSysCommands.map(c => {
      c.definition.type = "system";
      return c;
    });
  }

  getAllSystemCommandDefinitions() {
    let cmdDefs = this._registeredSysCommands.map(c => {
      let override = this._sysCommandOverrides[c.definition.id];
      if (override != null) {
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
      .concat(this.getAllCustomCommands());
  }

  forceUpdateSysCommandTrigger(id, newTrigger) {
    let override = this._sysCommandOverrides[c.definition.id];
    if (override != null) {
      override.trigger = newTrigger;
      this.saveSystemCommandOverride(override);
    }

    let defaultCmd = this._registeredSysCommands.find(
      c => c.definition.id === id
    );
    if (defaultCmd != null) {
      defaultCmd.trigger = trigger;
    }

    renderWindow.webContents.send("systemCommandsUpdated");
  }

  saveSystemCommandOverride(sysCommand) {
    this._sysCommandOverrides[sysCommand.id] = sysCommand;
    commandAccess.saveSystemCommandOverride(sysCommand);
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
