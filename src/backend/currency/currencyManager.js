"use strict";

import currencyManager from "./currency-manager";
import currencyCommandManager from "./currency-command-manager";

exports.startTimer = () => currencyManager.startTimer();
exports.stopTimer = () => currencyManager.stopTimer();
exports.createAllCurrencyCommands = () => currencyCommandManager.createAllCurrencyCommands();