"use strict";

const commandManager = require("./CommandManager");

exports.loadCommands = () => {
  // get command definitions
  const commandList = require("./builtin/commandList");
  const uptime = require("./builtin/uptime");
  const followage = require("./builtin/followage");
  const mixerage = require("./builtin/mixerage");

  // register them
  commandManager.registerSystemCommand(commandList);
  commandManager.registerSystemCommand(uptime);
  commandManager.registerSystemCommand(followage);
  commandManager.registerSystemCommand(mixerage);
};
