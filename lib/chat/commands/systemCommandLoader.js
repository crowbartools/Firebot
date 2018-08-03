"use strict";

const commandManager = require("./commandManager");

exports.loadCommands = () => {
  // get command definitions
  const commandList = require("./builtin/commandList");
  const uptime = require("./builtin/uptime");

  // register them
  commandManager.registerSystemCommand(commandList);
  commandManager.registerSystemCommand(uptime);
};
