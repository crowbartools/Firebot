"use strict";
const { ipcMain } = require("electron");
const userDatabase = require("./userDatabase");
const logger = require("../logwrapper");

//----------- CURRENCY FUNCTIONS ------------------
//add currency by username
function addCurrencyToUser(username, currencyId, value) {
  let db = userDatabase.getUserDb();
  userDatabase.getUserByUsername(username).then(user => {
    let updateDoc = {};
    updateDoc[`currency.${currencyId}`] = user.currency[
      currencyId
    ].amount += value;
    db.update({ _id: user._id }, { $set: updateDoc }, {}, function(
      err,
      numReplaced
    ) {
      if (err) {
        logger.error("Error adding currency to all users", err);
      }
    });
  });
}

//add currency to all online users
function addCurrencyToOnlineUsers(currencyId, value) {
  let db = userDatabase.getUserDb();
  db.find({ online: true }, (err, docs) => {
    for (let user in docs) {
      if (user != null) {
        addCurrencyToUser(user.username, currencyId, value);
      }
    }
  });
}

// Add currency to all users.
function addCurrencyToAllUsers(currencyId, value) {
  let db = userDatabase.getUserDb();
  let updateDoc = {};
  updateDoc[`currency.${currencyId}`] = value;
  db.update({}, { $set: updateDoc }, { multi: true }, function(
    err,
    numReplaced
  ) {
    if (err) {
      logger.error("Error adding currency to all users", err);
    }
  });
}

//find the amount of currency a user has, if any.
function getUserCurrencyAmount(username, currencyId) {
  return new Promise((resolve, reject) => {
    userDatabase.getUserByUsername(username).then(user => {
      if (user.currency[currencyId]) {
        resolve(user.currency[currencyId].amount);
      } else {
        resolve(0);
      }
    });
  });
}

// Set everyone to 0 for a specific currency.
function purgeCurrencyById(currencyId) {
  let db = userDatabase.getUserDb();
  let updateDoc = {};
  updateDoc[`currency.${currencyId}`] = 0;
  db.update({}, { $set: updateDoc }, { multi: true }, function(
    err,
    numReplaced
  ) {
    if (err) {
      logger.error("Error purging currency to all users", err);
    }
  });
}

// Deletes a currency from everyone.
// How to we delete only part of every doc? It looks like nedb remove only removes full docs.
function deleteCurrencyById(currencyId) {
  console.log('TODO: DELETE ' + currencyId);
}

//////////////////
// Event Listeners

// Create Currency Event
// This gets a message from front end when a currency needs to be created.
ipcMain.on("createCurrency", (event, currencyId) => {
  logger.info("Creating a new currency with id " + currencyId);
  addCurrencyToAllUsers(currencyId, 0);
});

// Purge Currency Event
// This gets a message from front end when a currency needs to be purged.
ipcMain.on("purgeCurrency", (event, currencyId) => {
  logger.debug("Purging currency with id " + currencyId);
  purgeCurrencyById(currencyId);
});

// Delete Currency Event
// This gets a message from front end when a currency needs to be deleted
ipcMain.on("deleteCurrency", (event, currencyId) => {
  logger.debug("Deleting currency with id " + currencyId);
  deleteCurrencyById(currencyId);
});

exports.addCurrencyToUser = addCurrencyToUser;
exports.addCurrencyToOnlineUsers = addCurrencyToOnlineUsers;
exports.getUserCurrencyAmount = getUserCurrencyAmount;
exports.purgeCurrencyById = purgeCurrencyById;
