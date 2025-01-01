"use strict";

const currencyAccess = require("../currency/currency-access").default;
const currencyManager = require("../currency/currency-manager");

exports.isViewerDBOn = () => currencyAccess.isViewerDBOn();
exports.refreshCurrencyCache = () => currencyAccess.loadCurrencies();
exports.addCurrencyToNewUser = viewer => currencyAccess.addCurrencyToNewViewer(viewer);
exports.getCurrencies = () => currencyAccess.getCurrencies();
exports.getCurrencyById = id => currencyAccess.getCurrencyById(id);
exports.getCurrencyByName = name => currencyAccess.getCurrencyByName(name);

exports.adjustCurrencyForUser = async (...args) => currencyManager.adjustCurrencyForViewer(...args);
exports.adjustCurrencyForUserById = async (...args) => currencyManager.adjustCurrencyForViewerById(...args);
exports.addCurrencyToOnlineUsers = async (...args) => currencyManager.addCurrencyToOnlineViewers(...args);
exports.getUserCurrencyAmount = async (...args) => currencyManager.getViewerCurrencyAmount(...args);
exports.getUserCurrencies = async (...args) => currencyManager.getViewerCurrencies(...args);
exports.getUserCurrencyRank = async (...args) => currencyManager.getViewerCurrencyRank(...args);
exports.purgeCurrencyById = async id => currencyManager.purgeCurrencyById(id);
exports.addCurrencyToUserGroupOnlineUsers = async (...args) => currencyManager.addCurrencyToViewerGroupOnlineViewers(...args);
exports.getTopCurrencyHolders = async (...args) => currencyManager.getTopCurrencyHolders(...args);
exports.getTopCurrencyPosition = async (...args) => currencyManager.getTopCurrencyPosition(...args);
exports.adjustCurrencyForAllUsers = async (...args) => currencyManager.adjustCurrencyForAllViewers(...args);