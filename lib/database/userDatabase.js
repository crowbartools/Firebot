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

function getUserOnlineMinutes(user) {
  return user.online
    ? user.minutesInChannel + (Date.now() - user.onlineAt) / 60000
    : user.minutesInChannel;
}

function setChatUserOffline(id) {
  //logger.debug("Setting user ", id, " offline.");
  let user = db.findOne({ _id: id });
  user.minutesInChannel =
    user.minutesInChannel + Math.round((Date.now() - user.onlineAt) / 60000);
  db.update({ _id: id }, { $set: { online: false } }, err => {
    if (err) {
      logger.error("Error setting chat user offline: ", err.message);
    }
  });
}

function setAllUsersOffline() {
  logger.debug("Setting all users offline... ");
  db.find({ online: true }, (err, docs) => {
    docs.map(u => setChatUserOffline(u._id));
  });
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

function setChatUserOnline(data) {
  return new Promise((resolve, reject) => {
    logger.debug("Add Chat User: ", data.username);
    db.findOne({ _id: data.id }, (err, doc) => {
      if (err) {
        logger.error(
          "Error retrieving doc for id ",
          data.id,
          ": ",
          err.message
        );
        reject();
      }
      if (doc) {
        db.update(
          { _id: data.id },
          {
            $set: {
              online: true,
              onlineAt: Date.now()
            }
          },
          err => {
            logger.debug("Error setting user online: ", err.message);
            logger.debug("Errored user: ", data);
            logger.debug("Found data: ", doc);
            reject();
          }
        );
      } else {
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
      }
    });
    resolve();
  });
}

function addCurrencyToUser(user, currencyId, value) {
  let newAmount = user.currency[currency.id].amount + value;
  db.update(
    { _id: user._id },
    {
      $set: { user: { currency: { "$(curency.id)": { amount: newAmount } } } }
    },
    err => {
      if (err) {
        logger.debug("Error updating currency amount: ", err.message);
      }
    }
  );
}

function addCurrencyToOnlineUsers(currencyId, value) {
  return new Promise((resolve, reject) => {
    db.find({ online: true }, (err, docs) => {
      if (err) {
        reject();
      }
      array.map.call(docs, doc => {
        doc.currency[currencyId].amount += value;
        db.update({ _id: doc._id }, doc, {});
      });
      resolve();
    });
  });
}

exports.setChatUserOnline = setChatUserOnline;
exports.connectUserDatabase = connectUserDatabase;
exports.setAllUsersOffline = setAllUsersOffline;
exports.setChatUserOffline = setChatUserOffline;
exports.addCurrencyToUser = addCurrencyToUser;
exports.addCurrencyToOnlineUsers = addCurrencyToOnlineUsers;
