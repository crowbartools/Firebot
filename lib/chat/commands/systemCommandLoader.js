"use strict";

const systemCommandManager = require("./systemCommandManager");

exports.loadCommands = () => {
  // get command definitions
  const commandList = require("./builtin/commandList");

  // register them
  systemCommandManager.registerCommand(commandList);
};
