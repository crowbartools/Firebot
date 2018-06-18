"use strict";
const Datastore = require("nedb");
const dataAccess = require("../common/data-access");
const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");

let db;

function connectCurrencyDatabase() {
  let path = profileManager.getPathInProfile("db/currency.db");
  db = new Datastore({ filename: path });
  db.loadDatabase(err => {
    if (err) {
      logger.error("Error Loading Database: ", err.message);
      logger.debug("Failed Database Path: ", path);
    }
  });
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

exports.connectCurrencyDatabase = connectCurrencyDatabase;
exports.addCurrencyToUser = addCurrencyToUser;
exports.addCurrencyToOnlineUsers = addCurrencyToOnlineUsers;
exports.getUserCurrencyAmount = getUserCurrencyAmount;
