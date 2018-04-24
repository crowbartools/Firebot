"use strict";

// id enum of default cmds
const DefaultCommand = {
  COMMAND_LIST: "commandslist"
};

const defaultCommandDefinitions = [
  {
    id: DefaultCommand.COMMAND_LIST,
    name: "Commands List",
    trigger: "!commands",
    active: true,
    description:
      "Whispers the sender a list of commands they have permission to use.",
    permission: {
      type: "group",
      groups: ["Moderators", "Channel Editors", "Streamer"]
    }
  }
];
