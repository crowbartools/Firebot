"use strict";
const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const profileManager = require("../common/profile-manager");

let getCommandsDb = () => profileManager.getJsonDbInProfile("/chat/commands");

// in memory commands storage
let commandsCache = {
  systemCommands: [],
  customCommands: [],
  timers: []
};

// Refreshes the commands cache
function refreshCommandCache(retry = 1) {
  // FB: I've set a weird retry thing here because I ran into a rare issue where upon saving settings the app tried to
  // save and get the same file at the same time which threw errors and caused the cache to get out
  // of sync.

  // Get commands file
  let commandsDb = getCommandsDb();

  // We've got the last used board! Let's update the interactive cache.
  if (commandsDb != null) {
    if (retry <= 3) {
      let cmdData;
      try {
        cmdData = commandsDb.getData("/");
      } catch (err) {
        logger.info(
          "Command cache update failed. Retrying. (Try " + retry + "/3)"
        );
        retry = retry + 1;
        logger.error("error getting command data", err);
        refreshCommandCache(retry);
        return;
      }

      if (cmdData.systemCommands) {
        commandsCache.systemCommands = Object.values(
          cmdData.systemCommands
        ).map(c => {
          c.type = "system";
          return c;
        });
      }

      if (cmdData.customCommands) {
        commandsCache.customCommands = Object.values(
          cmdData.customCommands
        ).map(c => {
          c.type = "custom";
          return c;
        });
      }

      if (cmdData.timers) {
        commandsCache.timers = Object.values(cmdData.timers);
      }

      logger.info("Updated Command cache.");
    } else {
      renderWindow.webContents.send(
        "error",
        "Could not sync up command cache. Reconnect to try resyncing."
      );
    }
  }
}

refreshCommandCache();

// Refresh Command Cache
// Refreshes backend command cache
ipcMain.on("refreshCommandCache", function() {
  refreshCommandCache();
});

exports.refreshCommandCache = refreshCommandCache;
exports.getSystemCommands = () => commandsCache.systemCommands;
exports.getCustomCommands = () => commandsCache.customCommands;
exports.getTimers = () => commandsCache.timers;
