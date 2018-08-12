"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const currencyDatabase = require("../database/currencyDatabase");
const moment = require("moment");

let currencyInterval = null;

// This file manages the currency payout intervals.
// For manipulating currency check out /database/currencyDatabase.js

// This is run when the interval fires for currencies.
function applyCurrency() {
    logger.debug("Running currency timer...");

    let currencyData = currencyDatabase.getCurrencies();

    Object.values(currencyData).forEach(currency => {
        let currentMinutes = moment().minutes();
        let intervalMod = currentMinutes % currency.interval;
        if (intervalMod === 0 && currency.active) {
            // do payout
            logger.debug(
                "Paying out currency " + currency.name + " amount " + currency.payout
            );
            currencyDatabase.addCurrencyToOnlineUsers(currency.id, currency.payout);
        } else {
            logger.debug(
                `${
                    currency.name
                } isnt ready to payout yet or currency is set to inactive.`
            );
        }
    });
}

// This will stop our currency timers.
function stopTimer() {
    logger.debug("Clearing previous currency intervals");
    if (currencyInterval != null) {
        clearInterval(currencyInterval);
        currencyInterval = null;
    }
}

// Start up our currency timers at the next full minute mark.
// Then we'll check all of our currencies each minute to see if any need to be applied.
function startTimer() {
    stopTimer();
    let currentTime = moment();
    let nextMinute = moment()
        .endOf("minute")
        .add(1, "s");
    let diff = nextMinute.diff(currentTime, "seconds");

    logger.debug(`Currency timer will start in ${diff} seconds`);

    setTimeout(() => {
        logger.debug("Starting currency timer.");
        //start timer, fire interval every minute.
        currencyInterval = setInterval(() => {
            applyCurrency();
        }, 60000);
    }, diff * 1000);
}

// Start up our currency timers.
// Also fired in currencyDatabase.js
ipcMain.on("refreshCurrencyCache", function() {
    startTimer();
});

exports.startTimer = startTimer;
exports.stopTimer = stopTimer;
