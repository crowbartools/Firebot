"use strict";
const events = require("events");
const mixerChat = require("./mixer-chat");

let connectionStream = new events.EventEmitter();

let isOnline = false;
let onlineCheckIntervalId;

function updateOnlineStatus(online) {
  if (isBoolean(online) && online !== isOnline) {
    isOnline = online === true;
    connectionStream.emit("streamerOnlineChange", isOnline);
  }
}

function checkOnline() {
  mixerChat.getGeneralChannelData(null, false).then(
    channelData => {
      if (channelData != null && typeof channelData === "boolean") {
        updateOnlineStatus(channelData.online);
      }
    },
    () => {}
  );
}

exports.connectionStream = connectionStream;

exports.startOnlineCheckInterval = () => {
  checkOnline();
  onlineCheckIntervalId = setInterval(checkOnline, 60000 * 5);
};
exports.setOnlineStatus = online => {
  updateOnlineStatus(online);
};
exports.streamerIsOnline = () => isOnline;
