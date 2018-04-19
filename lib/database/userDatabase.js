"use strict";
const Datastore = require("nedb");
const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");

let db;

//update users with last seen time
//allows us to recover chat hours from crash
function setLastSeenDateTime() {
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

//create a user from mixer user data
function createUserFromChat() {
  return new Promise((resolve, reject) => {
    let ins = {
      username: data.username,
      _id: data.id,
      roles: data.roles,
      online: true,
      onlineAt: Date.now(),
      lastSeen: Date.now(),
      minutesInChannel: 0,
      currency: {}
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
    if (!user.online) {
      user.online = true;
      user.onlineAt = Date.now();
      user.lastSeen = Date.now();
      db.update({ _id: user.id }, user, err => {
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
  logger.debug("setting user online", data.username);
  return new Promise((resolve, reject) => {
    logger.debug("Add Chat User: ", data.username);
    getUserById(data.id).then(
      user => {
        if (user) {
          user.roles = data.roles;
          setUserOnline(user).then(user => resolve(user), err => reject(err));
        } else {
          createUserFromChat().then(user => resolve(user), err => reject(err));
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
    getUserById(id).then(user => {
      if (user.online) {
        let dt =
          Date.now() - user.lastSeen > 60000 ? user.lastSeen : Date.now();
        user.minutesInChannel =
          user.minutesInChannel + Math.round((dt - user.onlineAt) / 60000);
        user.online = false;
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
  return Promise.all(
    db.find({ online: true }, (err, docs) => {
      docs.map(u => setChatUserOffline(u._id));
    })
  );
}

//establish the connection, set everyone offline, start last seen timer
function connectUserDatabase() {
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
}

//----------- CURRENCY FUNCTIONS ------------------
//backend function for adding currency with a user object
function addCurrencyToUserObj(user, currencyId, value) {
  return new Promise((resolve, reject) => {
    user.currency[currency.id].amount += value;
    db.update({ _id: user._id }, user, err => {
      if (err) {
        logger.debug("Error updating currency amount: ", err.message);
      }
    });
  });
}

//add currency by username
function addCurrencyToUser(username, currencyId, value) {
  getUserByUsername(username).then(user => {
    return addCurrencyToUserObj(user, currencyId, value);
  });
}

//add currency to all online users
function addCurrencyToOnlineUsers(currencyId, value) {
  db.find({ online: true }, (err, docs) => {
    return Promise.all(
      array.map.call(docs, doc => {
        addCurrencyToUserObj(doc, currency, value);
        // doc.currency[currencyId].amount += value;
        // db.update({ _id: doc._id }, doc, {});
      })
    );
  });
}

//find the amount of currency a user has, if any.
function getUserCurrencyAmount(username, currencyId) {
  return new Promise((resolve, reject) => {
    getUserByUsername(username).then(user => {
      if (user.currency[currencyId]) {
        resolve(user.currency[currencyId].amount);
      } else {
        resolve(0);
      }
    });
  });
}

exports.connectUserDatabase = connectUserDatabase;
exports.setChatUserOnline = setChatUserOnline;
exports.setChatUserOffline = setChatUserOffline;
exports.setAllUsersOffline = setAllUsersOffline;
exports.addCurrencyToUser = addCurrencyToUser;
exports.addCurrencyToOnlineUsers = addCurrencyToOnlineUsers;
exports.getUserCurrencyAmount = getUserCurrencyAmount;
exports.getUserOnlineMinutes = getUserOnlineMinutes;
exports.getUserByUsername = getUserByUsername;
