"use strict";
const { ipcMain } = require("electron");
const userDatabase = require("./userDatabase");
const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");

let currencyCache = {};

// Refresh our currency settings cache.
function refreshCurrencyCache() {
  let db = profileManager.getJsonDbInProfile("/currency/currency");
  currencyCache = db.getData("/");
}

//run when class first loads
refreshCurrencyCache();

// Returns our currency settings, or goes and gets a fresh copy.
function getCurrencies() {
  return currencyCache;
}

// Add Currency to User
// This will add an amount of currency to whatever value the user already has.
function addCurrencyToUser(username, currencyId, value) {
  let db = userDatabase.getUserDb();
  userDatabase.getUserByUsername(username).then(user => {
    let updateDoc = {};
    let newUserValue = (user.currency[currencyId] += parseInt(value));
    let currencyLimit = isNaN(parseInt(currencyCache[currencyId].limit))
      ? 0
      : currencyCache[currencyId].limit;

    // If new value would put them over the currency limit set by the user...
    // Just set them at currency limit. Otherwise add currency to what they have now.
    if (newUserValue > currencyLimit && currencyLimit !== 0) {
      updateDoc[`currency.${currencyId}`] = currencyLimit;
    } else {
      updateDoc[`currency.${currencyId}`] = newUserValue;
    }

    // Update the DB with our new currency value.
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

// Add Currency to all Online Users
// This will add an amount of currency to all users who are currently seen as online.
function addCurrencyToOnlineUsers(currencyId, value) {
  let db = userDatabase.getUserDb();
  db.find({ online: true }, (err, docs) => {
    for (let user of docs) {
      if (user != null) {
        addCurrencyToUser(user.username, currencyId, value);
      }
    }
  });
}

// Add Currency To All Users
// This will add currency to all users regardless of if they're online or not.
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

// This adds all of our active currencies to a new user.
// TODO: Cache the currencies somewhere so we dont hit the file with every new user.
function addCurrencyToNewUser(user) {
  let currencies = getCurrencies();
  Object.keys(currencies).forEach(function(currency) {
    currency = currencies[currency];
    user.currency[currency.id] = 0;
  });

  return user;
}

// Get User Currency Amount
// This will retrieve the amount of currency that a user has.
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

// Purge Currency
// This will set all users to 0 for a specific currency.
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

// Delete Currency
// This will completely delete a currency from the DB.
function deleteCurrencyById(currencyId) {
  let db = userDatabase.getUserDb();
  db.find({}, function(err, docs) {
    for (let i = 0; i < docs.length; i++) {
      let user = docs[i];
      delete user.currency[currencyId];
      db.update({ _id: user._id }, { $set: user }, {}, function(
        err,
        numReplaced
      ) {
        if (err) {
          logger.error("Error purging currency to all users", err);
        }
      });
    }
  });

  // Send to viewersService.js to delete from ui.
  renderWindow.webContents.send(
    "delete-currency-def",
    "currency." + currencyId
  );
}

//////////////////
// Event Listeners

// Refresh Currency Cache
// This gets a message from front end when a currency needs to be created.
// This is also triggered in the currencyManager.
ipcMain.on("refreshCurrencyCache", event => {
  logger.info("Refreshing the currency cache.");
  refreshCurrencyCache();
});

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
exports.addCurrencyToNewUser = addCurrencyToNewUser;
exports.refreshCurrencyCache = refreshCurrencyCache;
exports.getCurrencies = getCurrencies;
