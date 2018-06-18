"use strict";
const Datastore = require("nedb");
const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");
const moment = require("moment");
const { ipcMain } = require("electron");
const { settings } = require("../common/settings-access.js");

let db;
let updateTimeInterval;

// Checks the settings to see if viewer DB is set to on.
function isViewerDBOn() {
  return settings.getViewerDbStatus();
}

//update users with last seen time
//allows us to recover chat hours from crash
function setLastSeenDateTime() {
  if (!isViewerDBOn()) {
    return;
  }

  db.update(
    //sets all online users to last seen now, allow multiple updates
    { online: true },
    { $set: { lastSeen: Date.now() } },
    { multi: true },
    (err, num) => {
      if (err) {
        logger.debug("Error setting last seen");
      } else {
        logger.debug(`Last seen ${num} users`);
      }
    }
  );
  setTimeout(setLastSeenDateTime, 60000);
}

//look up user object by name
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    if (!isViewerDBOn()) {
      reject();
    }
    db.findOne({ username: username }, (err, doc) => {
      if (err) {
        reject(err.message);
      }
      resolve(doc);
    });
  });
}

//look up user object by id
function getUserById(id) {
  return new Promise((resolve, reject) => {
    if (!isViewerDBOn()) {
      reject();
    }
    db.findOne({ _id: id }, (err, doc) => {
      if (err) {
        reject(err.message);
      }
      resolve(doc);
    });
  });
}

//function to escape regex characters for search
function escape(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

//returns array of users based on fragment of username
function searchUsers(usernameFragment) {
  return new Promise((resolve, reject) => {
    if (!isViewerDBOn()) {
      reject();
    }
    db.find(
      { username: new RegExp("/" + escape(usernameFragment) + "/") },
      (docs, err) => {
        if (err) {
          reject(err.message);
        }
        resolve(docs);
      }
    );
  });
}

//calculate the amount of time a user has spent in chat
function getUserOnlineMinutes(username) {
  return new Promise((resolve, reject) => {
    if (!isViewerDBOn()) {
      reject();
    }

    getUserByUsername(username).then(
      user => {
        resolve(
          user.online
            ? user.minutesInChannel + (Date.now() - user.onlineAt) / 60000
            : user.minutesInChannel
        );
      },
      err => {
        reject(err);
      }
    );
  });
}

function calcUserOnlineMinutes(id) {
  return new Promise((resolve, reject) => {
    getUserById(id).then(user => {
      if (user.online) {
        let dt =
          Date.now() - user.lastSeen > 60000 ? user.lastSeen : Date.now();
        user.minutesInChannel =
          user.minutesInChannel + Math.round((dt - user.onlineAt) / 60000);
        db.update({ _id: id }, user, err => {
          if (err) {
            reject(err);
          }
          resolve();
        });
      }
    });
  });
}

// Recalculates online time for all users who are on line.
function calcAllUsersOnlineMinutes() {
  return Promise.all(
    db.find({ online: true }, (err, docs) => {
      docs.map(user => calcUserOnlineMinutes(user._id));
    })
  );
}

//create a user from mixer user data
function createUserFromChat(data) {
  return new Promise((resolve, reject) => {
    if (!isViewerDBOn()) {
      reject();
    }
    let ins = {
      username: data.username,
      _id: data.id,
      roles: data.roles,
      online: true,
      onlineAt: Date.now(),
      lastSeen: Date.now(),
      joinDate: Date.now(),
      minutesInChannel: 0,
      mixplayInteractions: 0,
      chatMessages: 0,
      currency: {},
      ranks: {}
    };
    db.insert(ins, err => {
      if (err) {
        logger.error("Error adding user: ", err.message);
        reject();
      } else {
        resolve(ins);
      }
    });
  });
}

//set a user online
function setUserOnline(user) {
  return new Promise((resolve, reject) => {
    if (!isViewerDBOn()) {
      reject();
    }

    if (!user.online) {
      user.online = true;
      user.onlineAt = Date.now();
      user.lastSeen = Date.now();
      db.update({ _id: user._id }, user, err => {
        if (err) {
          logger.debug("Error setting user online: ", err.message);
          logger.debug("Errored user: ", data);
          logger.debug("Found data: ", doc);
          reject();
        }
      });
      resolve(user);
    }
  });
}

//set a user online or add them to the database as online
function setChatUserOnline(data) {
  return new Promise((resolve, reject) => {
    if (!isViewerDBOn()) {
      reject();
    }

    getUserById(data.id).then(
      user => {
        if (user) {
          logger.debug("User exists in DB, setting online: ", data.username);
          user.roles = data.roles;
          setUserOnline(user).then(user => resolve(user), err => reject(err));
        } else {
          logger.debug(
            "Adding Chat User to DB and setting online: ",
            data.username
          );
          createUserFromChat(data).then(
            user => resolve(user),
            err => reject(err)
          );
        }
      },
      err => {
        reject(err);
      }
    );
  });
}

//set user offline, update time spent records
function setChatUserOffline(id) {
  return new Promise((resolve, reject) => {
    if (!isViewerDBOn()) {
      reject();
    }

    getUserById(id).then(user => {
      if (user.online) {
        let dt =
          Date.now() - user.lastSeen > 60000 ? user.lastSeen : Date.now();

        user.minutesInChannel =
          user.minutesInChannel + Math.round((dt - user.onlineAt) / 60000);

        user.online = false;

        logger.debug("SETTING USER OFFLINE: " + user._id);

        db.update({ _id: id }, user, err => {
          if (err) {
            reject(err);
          }
        });
      }
      resolve(user);
    });
  });
}

//set everyone offline mostly for when we start up or disconnect
function setAllUsersOffline() {
  return new Promise(resolve => {
    db.find({ online: true }, (err, docs) => {
      let promises = docs.map(u => setChatUserOffline(u._id));
      resolve(Promise.all(promises));
    });
  });
}

//establish the connection, set everyone offline, start last seen timer
function connectUserDatabase() {
  if (!isViewerDBOn()) {
    return;
  }

  let path = profileManager.getPathInProfile("db/users.db");
  db = new Datastore({ filename: path });
  db.loadDatabase(err => {
    if (err) {
      logger.error("Error Loading Database: ", err.message);
      logger.debug("Failed Database Path: ", path);
    }
  });
  logger.debug("User Database Loaded: ", path);
  setAllUsersOffline();
  setLastSeenDateTime();

  // Update online user minutes every X seconds.
  updateTimeInterval = setInterval(calcAllUsersOnlineMinutes, 900000);
}

// Clears the interval that updates everyones viewtime.
function clearOnlineMinutesInterval() {
  clearInterval(updateTimeInterval);
}

// This returns all rows from our DB for use in our UI.
function getRowsForUI() {
  return new Promise(resolve => {
    if (!isViewerDBOn()) {
      reject();
    }

    let rowData = [];

    // Find all documents in the collection
    // Make sure the row ids you're sending back match the DB defs.
    db.find({}, function(err, users) {
      Object.keys(users).forEach(function(k, user) {
        let userEntry = users[user],
          row = {
            _id: userEntry._id,
            username: userEntry.username,
            lastSeen: moment(userEntry.lastSeen).format("L"),
            minutesInChannel: userEntry.minutesInChannel,
            joinDate: moment(userEntry.joinDate).format("L"),
            mixplayInteractions: userEntry.mixplayInteractions,
            chatMessages: userEntry.chatMessages
          };

        // Push to row.
        rowData.push(row);
      });
      resolve(rowData);
    });
  });
}

// This will update a cell in the DB with new information.
// Change Packet: {userId: 0000, field: "username", value: "newUsername"}
function updateDbCell(changePacket) {
  if (!isViewerDBOn()) {
    return;
  }

  return new Promise((resolve, reject) => {
    let id = changePacket.userId,
      field = changePacket.field,
      newValue = changePacket.value;

    getUserById(id).then(user => {
      user[field] = newValue;
      db.update({ _id: id }, user, err => {
        if (err) {
          reject(err);
        }
      });
      resolve(user);
    });
  });
}

// Add Interactive Interaction to user.
function incrementDbField(userId, fieldName) {
  return new Promise((resolve, reject) => {
    if (!isViewerDBOn()) {
      reject();
    }

    // Look up current field if it exists, otherwise set value to one.
    // If field exists already, increment by one.
    getUserById(userId).then(user => {
      let data = {
        userId: userId,
        field: fieldName,
        value: 1
      };

      if (user[fieldName] != null) {
        data = {
          userId: userId,
          field: fieldName,
          value: user[fieldName] + 1
        };
      }

      logger.debug(
        "Incrementing DB Entry: " +
          userId +
          ", " +
          fieldName +
          ", " +
          data["value"]
      );

      updateDbCell(data);
      resolve(user);
    });
  });
}

//////////////////
// Event Listeners

// Return db rows for the ui to use.
ipcMain.on("request-viewer-db", event => {
  getRowsForUI().then(rows => {
    event.sender.send("viewer-db-response", rows);
  });
});

// Get change info from UI.
ipcMain.on("viewer-db-change", (event, data) => {
  updateDbCell(data);
});

// Connect to the DBs
ipcMain.on("viewerDbConnect", event => {
  connectUserDatabase();
  logger.debug("Connecting to user database.");
});

// Disconnect from DBs
ipcMain.on("viewerDbDisconnect", (event, data) => {
  setAllUsersOffline();
  db = null;

  // Clear the online time calc interval.
  clearOnlineMinutesInterval();
  logger.debug("Disconnecting from user database.");
});

exports.connectUserDatabase = connectUserDatabase;
exports.setChatUserOnline = setChatUserOnline;
exports.setChatUserOffline = setChatUserOffline;
exports.setAllUsersOffline = setAllUsersOffline;
exports.getUserOnlineMinutes = getUserOnlineMinutes;
exports.getUserByUsername = getUserByUsername;
exports.incrementDbField = incrementDbField;
