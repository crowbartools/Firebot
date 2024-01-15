"use strict";

const currencyAccess = require("../currency/currency-access").default;
const currencyManager = require("../currency/currency-manager");

exports.isViewerDBOn = currencyAccess.isViewerDBOn;
exports.refreshCurrencyCache = currencyAccess.refreshCurrencyCache;
exports.addCurrencyToNewUser = currencyAccess.addCurrencyToNewViewer;
exports.getCurrencies = currencyAccess.getCurrencies;
exports.getCurrencyById = currencyAccess.getCurrencyById;
exports.getCurrencyByName = currencyAccess.getCurrencyByName;

exports.adjustCurrencyForUser = currencyManager.adjustCurrencyForViewer;
exports.adjustCurrencyForUserById = currencyManager.adjustCurrencyForViewerById;
exports.addCurrencyToOnlineUsers = currencyManager.addCurrencyToOnlineViewers;
exports.getUserCurrencyAmount = currencyManager.getViewerCurrencyAmount;
exports.getUserCurrencies = currencyManager.getViewerCurrencies;
exports.getUserCurrencyRank = currencyManager.getViewerCurrencyRank;
exports.purgeCurrencyById = currencyManager.purgeCurrencyById;
exports.addCurrencyToUserGroupOnlineUsers = currencyManager.addCurrencyToViewerGroupOnlineViewers;
exports.getTopCurrencyHolders = currencyManager.getTopCurrencyHolders;
exports.getTopCurrencyPosition = currencyManager.getTopCurrencyPosition;
exports.adjustCurrencyForAllUsers = currencyManager.adjustCurrencyForAllViewers;