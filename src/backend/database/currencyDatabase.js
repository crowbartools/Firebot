"use strict";
const { ipcMain } = require("electron");
const userDatabase = require("./userDatabase");
const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");
const { settings } = require("../common/settings-access.js");
const customRolesManager = require("../roles/custom-roles-manager");
const teamRolesManager = require("../roles/team-roles-manager");
const twitchRolesManager = require("../../shared/twitch-roles");
const firebotRolesManager = require("../roles/firebot-roles-manager");
const frontendCommunicator = require("../common/frontend-communicator");
const util = require("../utility");

let currencyCache = {};

// Checks the settings to see if viewer DB is set to on.
function isViewerDBOn() {
    return settings.getViewerDbStatus();
}

// Refresh our currency settings cache.
function refreshCurrencyCache() {
    if (!isViewerDBOn()) {
        return;
    }
    const db = profileManager.getJsonDbInProfile("/currency/currency");
    currencyCache = db.getData("/");
}

//run when class first loads
refreshCurrencyCache();

// Returns our currency settings, or goes and gets a fresh copy.
function getCurrencies() {
    return currencyCache;
}

function getCurrencyById(currencyId) {
    const currencies = Object.values(currencyCache);
    return currencies.find(c => c.id === currencyId);
}

function getCurrencyByName(currencyName) {
    if (currencyName == null) {
        return null;
    }
    const currencies = Object.values(currencyCache);
    return currencies.find(c => c.name.toLowerCase() === currencyName.toLowerCase());
}

// Adjust Currency
// This adjust currency for a user. Can be given negative values. Provide it with the database record for a user.
function adjustCurrency(user, currencyId, value, adjustType = "adjust") {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve();
        }

        // Dont do anything if value is not a number or is 0.
        if (isNaN(value)) {
            return resolve();
        }

        value = parseInt(value);
        adjustType = adjustType.toLowerCase();
        let newUserValue = value;

        switch (adjustType) {
        case "set":
            logger.debug("Currency: Setting " + user.username + " currency " + currencyId + " to: " + value + ".");
            newUserValue = value;
            break;
        default:
            if (parseInt(value) === 0) {
                return resolve();
            }
            logger.debug("Currency: Adjusting " + value + " currency to " + user.username + ". " + currencyId);
            newUserValue = (user.currency[currencyId] + parseInt(value));
        }

        const db = userDatabase.getUserDb();
        const updateDoc = {};
        const currencyLimit = isNaN(currencyCache[currencyId].limit) ? 0 : currencyCache[currencyId].limit;

        // If new value would put them over the currency limit set by the user...
        // Just set them at currency limit. Otherwise add currency to what they have now.

        let valueToSet = newUserValue;
        if (newUserValue > currencyLimit && currencyLimit !== 0) {
            valueToSet = currencyLimit;
        } else if (newUserValue < 0) {
            valueToSet = 0;
        } else {
            valueToSet = newUserValue;
        }

        const previousValue = user.currency[currencyId] ?? 0;

        updateDoc[`currency.${currencyId}`] = valueToSet;

        // Update the DB with our new currency value.
        db.update({ _id: user._id }, { $set: updateDoc }, {}, function(err) {
            if (err) {
                logger.error("Currency: Error setting currency on user.", err);
            } else {
                const eventManager = require("../events/EventManager");
                eventManager.triggerEvent("firebot", "currency-update", {
                    username: user?.username,
                    currencyId: currencyId,
                    currencyName: currencyCache[currencyId]?.name,
                    previousCurrencyAmount: previousValue,
                    newCurrencyAmount: valueToSet
                });
            }
            return resolve();
        });
    });
}

// Adjust currency for user.
// This adjust currency when given a username. Can be given negative values to remove currency.
async function adjustCurrencyForUser(username, currencyId, value, adjustType = "adjust") {
    if (!isViewerDBOn()) {
        return false;
    }

    // Validate inputs.
    if (username === null || currencyId === null || value == null || isNaN(value)) {
        return false;
    }

    // Try to make value an integer.
    value = parseInt(value);

    // Trim username just in case we have extra spaces.
    username = username.trim();

    // Okay, it passes... let's try to add it.
    const user = await userDatabase.getUserByUsername(username);

    if (user !== false && user != null) {
        await adjustCurrency(user, currencyId, value, adjustType);
        return true;
    }

    return false;
}

async function adjustCurrencyForUserById(userId, currencyId, value, overrideValue) {
    if (!isViewerDBOn()) {
        return null;
    }

    const user = await userDatabase.getUserById(userId);

    if (user == null) {
        return null;
    }

    return adjustCurrencyForUser(user.username, currencyId, value, overrideValue ? 'set' : 'adjust');
}

// Add Currency to Usergroup
// This will add an amount of currency to all online users in a usergroup.
function addCurrencyToUserGroupOnlineUsers(roleIds = [], currencyId, value, ignoreDisable = false, adjustType = "adjust") {
    return new Promise(async resolve => {
        if (!isViewerDBOn()) {
            return resolve();
        }

        // Run our checks. Stop if we have a bad value, currency, or roles.
        value = parseInt(value);
        if (roleIds === [] || currencyId === null || value === null || (value === 0 && adjustType.toLowerCase() !== "set") || isNaN(value)) {
            return resolve();
        }

        const onlineUsers = await userDatabase.getOnlineUsers();

        /** @type{ Record<string, Array<{ id: string; name: string }>> } */
        const teamRoles = {};
        for (const user of onlineUsers) {
            teamRoles[user.username] = await teamRolesManager
                .getAllTeamRolesForViewer(user.username);
        }

        const userIdsInRoles = onlineUsers
            .map(u => {
                const twitchRoles = u.twitchRoles ?? [];

                u.allRoles = [
                    ...twitchRoles.map(tr => twitchRolesManager.mapTwitchRole(tr)),
                    ...customRolesManager.getAllCustomRolesForViewer(u.username),
                    ...teamRoles[u.username],
                    ...firebotRolesManager.getAllFirebotRolesForViewer(u.username)
                ];
                return u;
            })
            .filter(u => u.allRoles.some(r => roleIds.includes(r.id)))
            .map(u => u._id);

        // Log it.
        logger.debug('Paying out ' + value + ' currency (' + currencyId + ') for online users:');
        logger.debug("role ids", roleIds);
        logger.debug("user ids", userIdsInRoles);


        if (!userIdsInRoles.length) {
            return resolve();
        }

        // GIVE DEM BOBS.
        const db = userDatabase.getUserDb();
        db.find({ online: true, _id: { $in: userIdsInRoles } }, async (err, docs) => {
            if (!err) {
                for (const user of docs) {
                    if (user != null && (ignoreDisable || !user.disableAutoStatAccrual)) {
                        await adjustCurrency(user, currencyId, value, adjustType);
                    }
                }
            }

            resolve();
        });
    });
}

// Add Currency to all Online Users
// This will add an amount of currency to all users who are currently seen as online.
function addCurrencyToOnlineUsers(currencyId, value, ignoreDisable = false, adjustType = "adjust") {
    return new Promise((resolve, reject) => {
        if (!isViewerDBOn()) {
            return reject();
        }

        // Don't do anything for non numbers or 0 if we're not specifically setting a value.
        value = parseInt(value);
        if (isNaN(value) || (value === 0 && adjustType.toLowerCase() !== "set")) {
            return resolve();
        }

        const db = userDatabase.getUserDb();
        db.find({ online: true }, async (err, docs) => {
            // If error
            if (err) {
                return reject(err);
            }

            // Do the loop!
            for (const user of docs) {
                if (user != null && user.disableActiveUserList !== true &&
                    (ignoreDisable || !user.disableAutoStatAccrual)) {
                    await adjustCurrency(user, currencyId, value, adjustType);
                }
            }
            return resolve();
        });
    });
}

/**
 * Adjusts currency for all users in the database
 */
function adjustCurrencyForAllUsers(currencyId, value, ignoreDisable = false,
    adjustType = "adjust") {
    return new Promise((resolve, reject) => {
        if (!isViewerDBOn()) {
            return reject();
        }

        // Don't do anything for non numbers or 0 if we're not specifically setting a value.
        value = parseInt(value);
        if (isNaN(value) || (value === 0 && adjustType.toLowerCase() !== "set")) {
            return resolve();
        }

        const db = userDatabase.getUserDb();
        db.find({}, async (err, docs) => {
            // If error
            if (err) {
                return reject(err);
            }

            // Do the loop!
            for (const user of docs) {
                if (user != null &&
                    (ignoreDisable || !user.disableAutoStatAccrual)) {
                    await adjustCurrency(user, currencyId, value, adjustType);
                }
            }
            return resolve();
        });
    });
}

// Add Currency To All Users
// This will add currency to all users regardless of if they're online or not.
function addCurrencyToAllUsers(currencyId, value) {
    if (!isViewerDBOn()) {
        return;
    }
    const db = userDatabase.getUserDb();
    const updateDoc = {};
    updateDoc[`currency.${currencyId}`] = value;
    db.update({}, { $set: updateDoc }, { multi: true }, function(
        err
    ) {
        if (err) {
            logger.error("Error adding currency to all users", err);
        }
    });
}

// This adds all of our active currencies to a new user.
function addCurrencyToNewUser(user) {
    if (!isViewerDBOn()) {
        return;
    }
    const currencies = getCurrencies();
    Object.keys(currencies).forEach(function(currency) {
        currency = currencies[currency];
        user.currency[currency.id] = 0;
    });

    return user;
}

// Get User Currency Amount
// This will retrieve the amount of currency that a user has.
function getUserCurrencyAmount(username, currencyId) {
    return new Promise((resolve) => {
        if (!isViewerDBOn()) {
            return resolve(0);
        }
        userDatabase.getUserByUsername(username).then(user => {
            if (user != null && !isNaN(user.currency[currencyId])) {
                return resolve(user.currency[currencyId]);
            }
            return resolve(0);

        });
    });
}

async function getUserCurrencies(usernameOrId, isUsername = false) {
    if (!isViewerDBOn()) {
        return {};
    }
    const user = isUsername ?
        await userDatabase.getUserByUsername(usernameOrId) :
        await userDatabase.getUserById(usernameOrId);

    if (user == null) {
        return null;
    }

    return user.currency;
}

async function getUserCurrencyRank(currencyId, usernameOrId, isUsername = false) {
    if (!isViewerDBOn()) {
        return 0;
    }

    const user = isUsername ?
        await userDatabase.getUserByUsername(usernameOrId) :
        await userDatabase.getUserById(usernameOrId);

    if (user == null) {
        return 0;
    }

    const db = userDatabase.getUserDb();

    const sortObj = {};
    sortObj[`currency.${currencyId}`] = -1;

    const projectionObj = { username: 1, displayName: 1};
    projectionObj[`currency.${currencyId}`] = 1;

    const rank = await new Promise ((resolve) => {
        db.find({ twitch: true })
            .sort(sortObj)
            .projection(projectionObj)
            .exec(function (err, docs) {
                if (err) {
                    logger.error("Error getting user currency rank: ", err);
                    return resolve(0);
                }
                return resolve(docs.findIndex(d => d.username === user.username) + 1);
            });
    });

    return rank;
}

function getTopCurrencyPosition(currencyId, position = 1) {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve(null);
        }

        const db = userDatabase.getUserDb();

        const sortObj = {};
        sortObj[`currency.${currencyId}`] = -1;

        const projectionObj = { username: 1, displayName: 1};
        projectionObj[`currency.${currencyId}`] = 1;

        db.find({ twitch: true })
            .sort(sortObj)
            .skip(position - 1)
            .limit(1)
            .projection(projectionObj)
            .exec(function (err, docs) {
                if (err) {
                    logger.error("Error getting top currency holders: ", err);
                    return resolve(null);
                }
                return resolve(docs && !!docs.length ? docs[0] : null);
            });
    });
}

function getTopCurrencyHolders(currencyIdOrName, count, byName = false) {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve([]);
        }

        let currencyId = currencyIdOrName;
        if (byName) {
            currencyId = (getCurrencyByName(currencyIdOrName)).id;
        }

        const db = userDatabase.getUserDb();

        const sortObj = {};
        sortObj[`currency.${currencyId}`] = -1;

        const projectionObj = { username: 1, displayName: 1};
        projectionObj[`currency.${currencyId}`] = 1;

        db.find({ twitch: true })
            .sort(sortObj)
            .limit(count)
            .projection(projectionObj)
            .exec(function (err, docs) {
                if (err) {
                    logger.error("Error getting top currency holders: ", err);
                    return resolve([]);
                }
                return resolve(docs || []);
            });
    });
}

// Purge Currency
// This will set all users to 0 for a specific currency.
function purgeCurrencyById(currencyId) {
    if (!isViewerDBOn()) {
        return;
    }
    const db = userDatabase.getUserDb();
    const updateDoc = {};
    updateDoc[`currency.${currencyId}`] = 0;
    db.update({}, { $set: updateDoc }, { multi: true }, function(
        err
    ) {
        if (err) {
            logger.error("Error purging currency to all users", err);
        }
    });
}

// Delete Currency
// This will completely delete a currency from the DB.
function deleteCurrencyById(currencyId) {
    if (!isViewerDBOn()) {
        return;
    }
    const db = userDatabase.getUserDb();
    db.find({}, function(err, docs) {
        for (let i = 0; i < docs.length; i++) {
            const user = docs[i];
            delete user.currency[currencyId];
            db.update({ _id: user._id }, { $set: user }, {}, function(
                err
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

/**
 * @typedef CurrencyInfo
 * @property {string} currencyId
 * @property {"allOnline" | "allOnlineInRole" | "individual"} targetType
 * @property {string} [username]
 * @property {boolean} sendChatMessage
 * @property {number} amount
 * @property {string} role
 */

frontendCommunicator.onAsync("give-currency", async (/** @type {CurrencyInfo} */ {
    currencyId,
    amount,
    sendChatMessage,
    targetType,
    username,
    role
}) => {
    const currency = getCurrencyById(currencyId);
    if (currency == null) {
        logger.error("Couldn't find currency to give or remove", {location: "currencyDatabase.js:480"});
        return;
    }

    let messageTarget = "";
    switch (targetType) {
    case "allOnline":
        await addCurrencyToOnlineUsers(currencyId, amount);
        messageTarget = `everyone`;
        break;
    case "allOnlineInRole":
        addCurrencyToUserGroupOnlineUsers([role], currencyId, amount);
        messageTarget = `all users in role ${role}`;
        break;
    case "individual":
        await adjustCurrencyForUser(username, currencyId, amount);
        messageTarget = `@${username}`;
        break;
    }

    if (sendChatMessage && messageTarget !== "") {
        const twitchChat = require("../chat/twitch-chat");
        if (!twitchChat.chatIsConnected) {
            return;
        }

        await twitchChat.sendChatMessage(`${amount < 0 ? "Removed" : "Gave"} ${util.commafy(amount)} ${currency.name} ${amount < 0 ? "from" : "to"} ${messageTarget}!`);
    }
});

// Refresh Currency Cache
// This gets a message from front end when a currency needs to be created.
// This is also triggered in the currencyManager.
ipcMain.on("refreshCurrencyCache", () => {
    if (!isViewerDBOn()) {
        return;
    }
    logger.debug("Refreshing the currency cache.");
    refreshCurrencyCache();
});

// Create Currency Event
// This gets a message from front end when a currency needs to be created.
ipcMain.on("createCurrency", (event, currencyId) => {
    if (!isViewerDBOn()) {
        return;
    }
    logger.info("Creating a new currency with id " + currencyId);
    addCurrencyToAllUsers(currencyId, 0);
});

// Purge Currency Event
// This gets a message from front end when a currency needs to be purged.
ipcMain.on("purgeCurrency", (event, currencyId) => {
    if (!isViewerDBOn()) {
        return;
    }
    logger.info("Purging currency with id " + currencyId);
    purgeCurrencyById(currencyId);
});

// Delete Currency Event
// This gets a message from front end when a currency needs to be deleted
ipcMain.on("deleteCurrency", (event, currencyId) => {
    if (!isViewerDBOn()) {
        return;
    }
    logger.info("Deleting currency with id " + currencyId);
    deleteCurrencyById(currencyId);
});

exports.adjustCurrencyForUser = adjustCurrencyForUser;
exports.adjustCurrencyForUserById = adjustCurrencyForUserById;
exports.addCurrencyToOnlineUsers = addCurrencyToOnlineUsers;
exports.getUserCurrencyAmount = getUserCurrencyAmount;
exports.getUserCurrencies = getUserCurrencies;
exports.getUserCurrencyRank = getUserCurrencyRank;
exports.purgeCurrencyById = purgeCurrencyById;
exports.addCurrencyToNewUser = addCurrencyToNewUser;
exports.refreshCurrencyCache = refreshCurrencyCache;
exports.getCurrencies = getCurrencies;
exports.getCurrencyById = getCurrencyById;
exports.getCurrencyByName = getCurrencyByName;
exports.addCurrencyToUserGroupOnlineUsers = addCurrencyToUserGroupOnlineUsers;
exports.isViewerDBOn = isViewerDBOn;
exports.getTopCurrencyHolders = getTopCurrencyHolders;
exports.getTopCurrencyPosition = getTopCurrencyPosition;
exports.adjustCurrencyForAllUsers = adjustCurrencyForAllUsers;
