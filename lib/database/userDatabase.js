"use strict";
const Datastore = require("nedb");
const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");

let db;

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

function setChatUserOnline(data) {
  logger.debug("setting user online", data.username);
  return new Promise((resolve, reject) => {
    logger.debug("Add Chat User: ", data.username);
    getUserById(data.id).then(
      user => {
        user.online = true;
        user.onlineAt = Date.now();
        user.roles = data.roles;
        db.update({ _id: data.id }, user, err => {
          logger.debug("Error setting user online: ", err.message);
          logger.debug("Errored user: ", data);
          logger.debug("Found data: ", doc);
          reject();
        });
        resolve(user);
      },
      err => {
        let ins = {
          username: data.username,
          _id: data.id,
          roles: data.roles,
          online: true,
          onlineAt: Date.now(),
          minutesInChannel: 0,
          currency: {}
        };
        db.insert(ins, err => {
          logger.error("Error adding user: ", err.message);
          reject();
        });
        resolve(ins);
      }
    );
  });
}

function setChatUserOffline(id) {
  return new Promise((resolve, reject) => {
    getUserById(id).then(user => {
      user.minutesInChannel =
        user.minutesInChannel +
        Math.round((Date.now() - user.onlineAt) / 60000);
      user.online = false;
      db.update({ _id: id }, user, err => {
        if (err) {
          reject(err);
        }
      });
      resolve(user);
    });
  });
}

function setAllUsersOffline() {
  return Promise.all(
    db.find({ online: true }, (err, docs) => {
      docs.map(u => setChatUserOffline(u._id));
    })
  );
}

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
}

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

function addCurrencyToUser(username, currencyId, value) {
  return new Promise((resolve, reject) => {
    getUserByUsername(username).then(user => {
      return addCurrencyToUserObj(user, currencyId, value);
    });
  });
}

function addCurrencyToOnlineUsers(currencyId, value) {
  return new Promise((resolve, reject) => {
    db.find({ online: true }, (err, docs) => {
      if (err) {
        reject();
      }
      return Promise.all(
        array.map.call(docs, doc => {
          addCurrencyToUserObj(doc, currency, value);
          // doc.currency[currencyId].amount += value;
          // db.update({ _id: doc._id }, doc, {});
        })
      );
    });
  });
}

exports.setChatUserOnline = setChatUserOnline;
exports.connectUserDatabase = connectUserDatabase;
exports.setChatUserOffline = setChatUserOffline;
exports.setAllUsersOffline = setAllUsersOffline;
exports.addCurrencyToUser = addCurrencyToUser;
exports.addCurrencyToOnlineUsers = addCurrencyToOnlineUsers;
exports.getUserOnlineMinutes = getUserOnlineMinutes;
