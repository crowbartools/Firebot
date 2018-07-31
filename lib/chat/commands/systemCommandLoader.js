"use strict";

const commandManager = require("./commandManager");

exports.loadCommands = () => {
  // get command definitions
  const commandList = require("./builtin/commandList");

  // register them
  commandManager.registerSystemCommand(commandList);
};
