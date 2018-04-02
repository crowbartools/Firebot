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

exports.connectCurrencyDatabase = connectCurrencyDatabase;
