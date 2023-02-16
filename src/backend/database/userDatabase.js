"use strict";
const Datastore = require("nedb");
const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");
const moment = require("moment");
const { ipcMain } = require("electron");
const { settings } = require("../common/settings-access.js");
const currencyDatabase = require("./currencyDatabase");
const twitchChat = require("../chat/twitch-chat");
const frontendCommunicator = require("../common/frontend-communicator");
const userAccess = require("../common/user-access");
const eventManager = require("../events/EventManager");
const accountAccess = require("../common/account-access");
const util = require("../utility");
const chatRolesManager = require('../roles/chat-roles-manager');

const jsonDataHelpers = require("../common/json-data-helpers");

/**
 * @typedef FirebotUser
 * @property {string} _id
 * @property {string} username
 * @property {string} displayName
 * @property {string} profilePicUrl
 * @property {boolean} twitch
 * @property {string[]} twitchRoles
 * @property {boolean} online
 * @property {number} onlineAt
 * @property {number} lastSeen
 * @property {number} joinDate
 * @property {number} minutesInChannel
 * @property {number} chatMessages
 * @property {boolean} disableAutoStatAccrual
 * @property {boolean} disableActiveUserList
 * @property {boolean} disableViewerList
 * @property {Object.<string, *>=} metadata
 * @property {Object.<string, number>} currency
 */

/**
 * @type Datastore<FirebotUser>
 */
let db;
let updateTimeIntervalId;
let updateLastSeenIntervalId;
const dbCompactionInterval = 30000;

function getUserDb() {
    return db;
}

// Checks the settings to see if viewer DB is set to on.
function isViewerDBOn() {
    return settings.getViewerDbStatus();
}

//update users with last seen time
//allows us to recover chat hours from crash
function setLastSeenDateTime() {
    if (!isViewerDBOn()) {
        return;
    }

    db.update({ online: true }, { $set: { lastSeen: Date.now() } }, { multi: true }, (err, num) => {
        if (err) {
            logger.debug("ViewerDB: Error setting last seen");
        } else {
            logger.debug(`ViewerDB: Setting last seen date for ${num} users`);
        }
    });
}

/**
 *
 * @param {string} username
 * @returns {Promise<FirebotUser>}
 */
function getUserByUsername(username) {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve(false);
        }

        const searchTerm = new RegExp(`^${username}$`, 'i');

        db.findOne({ username: { $regex: searchTerm }, twitch: true }, (err, doc) => {
            if (err) {
                return resolve(false);
            }
            return resolve(doc);
        });
    });
}

/**
 *
 * @param {string} username
 * @returns {Promise<FirebotUser>}
 */
function getTwitchUserByUsername(username) {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve(null);
        }

        const searchTerm = new RegExp(`^${username}$`, 'i');

        db.findOne({ username: { $regex: searchTerm }, twitch: true }, (err, doc) => {
            if (err) {
                return resolve(null);
            }
            return resolve(doc);
        });
    });
}

/**
 *
 * @param {FirebotUser} user
 * @returns {Promise<boolean>}
 */
function updateUser(user) {
    return new Promise(resolve => {
        if (user == null) {
            return resolve(false);
        }
        db.update({ _id: user._id }, user, {}, function (err) {
            if (err) {
                logger.warn("Failed to update user in DB", err);
                return resolve(false);
            }
            resolve(true);
        });
    });
}

async function updateUserMetadata(username, key, value, propertyPath) {

    if (username == null || username.length < 1 || key == null || key.length < 1) {
        return;
    }

    const user = await getTwitchUserByUsername(username);
    if (user == null) {
        return;
    }

    const metadata = user.metadata || {};

    try {
        const dataToSet = jsonDataHelpers.parseData(value, metadata[key], propertyPath);
        metadata[key] = dataToSet;

        user.metadata = metadata;

        await updateUser(user);
    } catch (error) {
        logger.error("Unable to set metadata for user");
    }
}

async function removeUserMetadata(username, key) {

    if (username == null || username.length < 1 || key == null || key.length < 1) {
        return;
    }

    const user = await getTwitchUserByUsername(username);
    if (user == null) {
        return;
    }

    const metadata = user.metadata || {};

    delete metadata[key];

    user.metadata = metadata;

    await updateUser(user);
}

frontendCommunicator.onAsync("update-user-metadata", async ({ username, key, value }) => {
    updateUserMetadata(username, key, value);
});

frontendCommunicator.onAsync("delete-user-metadata", async ({ username, key }) => {
    removeUserMetadata(username, key);
});

async function getUserMetadata(username, key, propertyPath) {
    if (username == null || username.length < 1 || key == null || key.length < 1) {
        return null;
    }

    const user = await getTwitchUserByUsername(username);

    if (user == null) {
        return null;
    }

    const metadata = user.metadata || {};

    return jsonDataHelpers.readData(metadata[key], propertyPath);
}

/**
 *
 * @param {string} id
 * @returns {Promise<FirebotUser>}
 */
function getUserById(id) {
    return new Promise((resolve) => {
        if (!isViewerDBOn()) {
            return resolve(null);
        }

        db.findOne({ _id: id }, (err, doc) => {
            if (err) {
                logger.error(err);
                resolve(null);
            }
            resolve(doc);
        });
    });
}

function getAllUsernames() {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve([]);
        }

        const projectionObj = {
            displayName: 1
        };

        db.find({ twitch: true }).projection(projectionObj).exec(function (err, docs) {
            if (err) {
                logger.error("Error getting all users: ", err);
                return resolve([]);
            }
            return resolve(docs != null ? docs.map(u => u.displayName) : []);
        });
    });
}

function getAllUsernamesWithIds() {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve([]);
        }

        const projectionObj = {
            displayName: 1
        };

        db.find({ twitch: true }).projection(projectionObj).exec(function (err, docs) {
            if (err) {
                logger.error("Error getting all users: ", err);
                return resolve([]);
            }
            return resolve(docs != null ? docs.map(u => ({ id: u._id, username: u.displayName })) : []);
        });
    });
}

function getTopViewTimeUsers(count) {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve([]);
        }

        const sortObj = {
            minutesInChannel: -1
        };

        const projectionObj = {
            username: 1,
            minutesInChannel: 1
        };

        db.find({}).sort(sortObj).limit(count).projection(projectionObj).exec(function (err, docs) {
            if (err) {
                logger.error("Error getting top view time users: ", err);
                return resolve([]);
            }
            return resolve(docs || []);
        });
    });
}

//calculate the amount of time a user has spent in chat
function getUserOnlineMinutes(username) {
    return new Promise((resolve, reject) => {
        if (!isViewerDBOn()) {
            return resolve();
        }
        getUserByUsername(username).then(user => {
            resolve(
                user.online ? user.minutesInChannel + (Date.now() - user.onlineAt) / 60000 : user.minutesInChannel
            );
        },
        err => {
            reject(err);
        });
    });
}

/**
 * Triggers a View Time Update event if view time hours has increased
 */
function userViewTimeUpdate(user, previousTotalMinutes, newTotalMinutes) {
    if (user == null) {
        return;
    }
    const previousHours = previousTotalMinutes > 0 ? parseInt(previousTotalMinutes / 60) : 0;
    const newHours = newTotalMinutes > 0 ? parseInt(newTotalMinutes / 60) : 0;
    if (newHours < 1) {
        return;
    }
    if (newHours !== previousHours) {

        eventManager.triggerEvent("firebot", "view-time-update", {
            username: user.username,
            previousViewTime: previousHours,
            newViewTime: newHours
        });
    }
}

function calcUserOnlineMinutes(user) {
    if (!isViewerDBOn() || !user.online || user.disableAutoStatAccrual) {
        return Promise.resolve();
    }

    const now = Date.now();

    // user.lastSeen is updated every minute by "setLastSeenDateTime".
    // If user.lastSeen was over a minute ago, we use user.lastSeen, otherwise we just use the current time.
    const lastSeen = (user.lastSeen && (now - user.lastSeen) > 60000) ? user.lastSeen : now;

    // Calculate the minutes to add to the user's total
    // Since this method is on a 15 min interval, we don't want to add anymore than 15 new minutes.
    const additionalMinutes = Math.min(Math.round((lastSeen - user.onlineAt) / 60000), 15);

    // No new minutes to add; return early to avoid hit to DB
    if (additionalMinutes < 1) {
        return Promise.resolve();
    }

    // Calculate users new minutes total.
    const previousTotalMinutes = user.minutesInChannel;
    const newTotalMinutes = previousTotalMinutes + additionalMinutes;

    return new Promise(resolve => {
        db.update({ _id: user._id }, { $set: { minutesInChannel: newTotalMinutes } }, {}, (err, numReplaced) => {
            if (err) {
                logger.debug('ViewerDB: Couldnt update users online minutes because of an error. UserId: ' + user._id);
                logger.debug(err);
            } else if (numReplaced === 0) {
                logger.debug('ViewerDB: Couldnt update users online minutes. UserId: ' + user._id);
            } else {
                userViewTimeUpdate(user, previousTotalMinutes, newTotalMinutes);
            }
            resolve();
        });
    });
}

// Recalculates online time for all users who are online.
function calcAllUsersOnlineMinutes() {
    const connectionManager = require("../common/connection-manager");
    if (connectionManager.streamerIsOnline()) {
        db.find({ online: true }, (err, docs) => {
            if (!err) {
                docs.forEach(user => calcUserOnlineMinutes(user));
            }
        });
    }
}

function removeUser(userId) {
    return new Promise(resolve => {
        if (userId == null) {
            return resolve(false);
        }
        db.remove({ _id: userId }, {}, function (err) {
            if (err) {
                logger.warn("Failed to remove user from DB", err);
                return resolve(false);
            }
            resolve(true);
        });
    });
}

/**
 * @returns {Promise<FirebotUser>}
 */
function createNewUser(userId, username, displayName, profilePicUrl, twitchRoles, isOnline = false) {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve(null);
        }

        const streamerUserId = accountAccess.getAccounts().streamer.userId;
        const botUserId = accountAccess.getAccounts().bot.userId;

        const disableAutoStatAccrual = userId === streamerUserId || userId === botUserId;

        /**@type {FirebotUser} */
        let user = {
            username: username,
            _id: userId,
            displayName: displayName,
            profilePicUrl: profilePicUrl,
            twitch: true,
            twitchRoles: twitchRoles || [],
            online: isOnline,
            onlineAt: Date.now(),
            lastSeen: Date.now(),
            joinDate: Date.now(),
            minutesInChannel: 0,
            chatMessages: 0,
            disableAutoStatAccrual: disableAutoStatAccrual,
            disableActiveUserList: false,
            disableViewerList: false,
            metadata: {},
            currency: {}
        };

        // THIS IS WHERE YOU ADD IN ANY DYNAMIC FIELDS THAT ALL USERS SHOULD HAVE.
        // Add in all of our currencies and set them to 0.
        user = currencyDatabase.addCurrencyToNewUser(user);

        // Insert our record into db.
        db.insert(user, err => {
            if (err) {
                logger.error("ViewerDB: Error adding user", err);
                resolve(null);
            } else {
                eventManager.triggerEvent("firebot", "viewer-created", {
                    username: displayName
                });
                resolve(user);
            }
        });
    });
}

/**
 * @returns {Promise<FirebotUser[]>}
 */
function getOnlineUsers() {
    return new Promise(resolve => {
        db.find({ online: true }, async (err, docs) => {
            if (err) {
                return resolve([]);
            }
            resolve(docs);
        });
    });
}

function getPurgeWherePredicate(options) {
    return function () {
        const user = this;

        if (!user.twitch) {
            return false;
        }

        let daysInactive = 0;
        if (options.daysSinceActive.enabled) {
            daysInactive = moment().diff(moment(user.lastSeen), "days");
        }
        const viewTimeHours = user.minutesInChannel / 60;

        if ((options.daysSinceActive.enabled || options.viewTimeHours.enabled || options.chatMessagesSent.enabled) &&
        (!options.daysSinceActive.enabled || daysInactive > options.daysSinceActive.value) &&
        (!options.viewTimeHours.enabled || viewTimeHours < options.viewTimeHours.value) &&
        (!options.chatMessagesSent.enabled || user.chatMessages < options.chatMessagesSent.value)) {
            return true;
        }
        return false;
    };
}

/**
 * @returns {Promise<FirebotUser[]>}
 */
function getPurgeUsers(options) {
    return new Promise(resolve => {
        db.find({ $where: getPurgeWherePredicate(options)}, (err, docs) => {
            if (err) {
                return resolve([]);
            }
            resolve(docs);
        });
    });
}

function purgeUsers(options) {
    return new Promise(resolve => {
        const backupManager = require("../backupManager");
        backupManager.startBackup(false, () => {
            db.remove({ $where: getPurgeWherePredicate(options)}, {multi: true},
                (err, numRemoved) => {
                    if (err) {
                        return resolve(0);
                    }
                    resolve(numRemoved);
                });
        });
    });
}

/**
 * @typedef {Object} UserDetails
 * @property {number} id
 * @property {string} username
 * @property {string} displayName
 * @property {string} profilePicUrl
 * @property {string[]} twitchRoles
 */

/**
 * Set a user as online
 * @param {UserDetails} userDetails
 */
function setChatUserOnline(userDetails) {
    return new Promise((resolve) => {
        if (!isViewerDBOn()) {
            return resolve();
        }

        const now = Date.now();
        const dbData = {
            username: userDetails.username,
            displayName: userDetails.displayName,
            profilePicUrl: userDetails.profilePicUrl,
            twitchRoles: userDetails.twitchRoles,
            online: true,
            onlineAt: now,
            lastSeen: now
        };

        if (chatRolesManager.userIsKnownBot(userDetails.username) && settings.getAutoFlagBots()) {
            dbData.disableAutoStatAccrual = true;
            dbData.disableActiveUserList = true;
        }

        db.update(
            { _id: userDetails.id },
            {
                $set: dbData
            },
            {},
            function (err) {
                if (err) {
                    logger.error("Failed to set user to online", err);
                }
                resolve();
            });
    });
}

/**
 * Adds a new user to the database
 * @param {UserDetails} userDetails
 */
function addNewUserFromChat(userDetails, isOnline = true) {
    return createNewUser(userDetails.id, userDetails.username, userDetails.displayName,
        userDetails.profilePicUrl, userDetails.twitchRoles, isOnline);
}

// Sets chat users online using the same function we use to get the chat viewer list for the ui.
async function setChatUsersOnline() {
    await twitchChat.populateChatterList();
    const viewers = await twitchChat.getViewerList();

    if (viewers == null) {
        return;
    }

    for (const viewer of viewers) {

        // Here we convert the viewer list viewer object to one that matches
        // what we get from chat messages...
        const viewerPacket = {
            id: viewer.id,
            username: viewer.username,
            twitchRoles: viewer.twitchRoles
        };

        setChatUserOnline(viewerPacket);
    }
}

//set user offline, update time spent records
function setChatUserOffline(id) {
    return new Promise((resolve) => {
        if (!isViewerDBOn()) {
            return resolve();
        }

        // Find the user by id to get their minutes viewed.
        // Update their minutes viewed with our new times.
        db.find({ _id: id }, (err, user) => {
            if (err) {
                logger.error(err);
                return;
            }
            if (user == null || user.length < 1) {
                return;
            }
            db.update({ _id: user[0]._id }, { $set: { online: false } }, {}, function(err) {
                if (err) {
                    logger.error("ViewerDB: Error setting user to offline.", err);
                } else {
                    logger.debug("ViewerDB: Set " + user[0].username + "(" + user[0]._id + ") to offline.");
                }
                return resolve();
            });
        }); // End find
    });
}

//set everyone offline mostly for when we start up or disconnect
function setAllUsersOffline() {
    return new Promise(resolve => {
        if (!isViewerDBOn() || db == null) {
            return resolve();
        }

        logger.debug('ViewerDB: Trying to set all users to offline.');

        db.update({online: true}, {$set: { online: false }}, { multi: true }, function(err, numReplaced) {
            if (numReplaced > 0) {
                logger.debug('ViewerDB: Set ' + numReplaced + ' users to offline.');
            } else {
                logger.debug('ViewerDB: No users were set to offline.');
            }
            resolve();
        });
    });
}

twitchChat.on("connected", () => {
    setChatUsersOnline();
});

twitchChat.on("disconnected", () => {
    setAllUsersOffline();
});

//establish the connection, set everyone offline, start last seen timer
function connectUserDatabase() {
    logger.info('ViewerDB: Trying to connect to user database...');
    if (!isViewerDBOn()) {
        return;
    }

    const path = profileManager.getPathInProfile("db/users.db");
    db = new Datastore({ filename: path });
    db.loadDatabase(err => {
        if (err) {
            logger.info("ViewerDB: Error Loading Database: ", err.message);
            logger.info("ViewerDB: Failed Database Path: ", path);
        }
    });

    // Setup our automatic compaction interval to shrink filesize.
    db.persistence.setAutocompactionInterval(dbCompactionInterval);
    setInterval(function() {
        logger.debug('ViewerDB: Compaction should be happening now. Compaction Interval: ' + dbCompactionInterval);
    }, dbCompactionInterval);

    logger.info("ViewerDB: User Database Loaded: ", path);
    setAllUsersOffline();

    // update online users lastSeen prop every minute
    updateLastSeenIntervalId = setInterval(setLastSeenDateTime, 60000);

    // Update online user minutes every 15 minutes.
    updateTimeIntervalId = setInterval(calcAllUsersOnlineMinutes, 900000);
}

function getTopMetadataPosition(metadataKey, position = 1) {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve(null);
        }

        const sortObj = {};
        sortObj[`metadata.${metadataKey}`] = -1;

        const projectionObj = { username: 1, displayName: 1};
        projectionObj[`metadata.${metadataKey}`] = 1;

        db.find({ twitch: true })
            .sort(sortObj)
            .skip(position - 1)
            .limit(1)
            .projection(projectionObj)
            .exec(function (err, docs) {
                if (err) {
                    logger.error("Error getting top metadata request: ", err);
                    return resolve(null);
                }
                return resolve(docs && !!docs.length ? docs[0] : null);
            });
    });
}

function getTopMetadata(metadataKey, count) {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve([]);
        }

        const sortObj = {};
        sortObj[`metadata.${metadataKey}`] = -1;

        const projectionObj = { username: 1, displayName: 1};
        projectionObj[`metadata.${metadataKey}`] = 1;

        db.find({ twitch: true })
            .sort(sortObj)
            .limit(count)
            .projection(projectionObj)
            .exec(function (err, docs) {
                if (err) {
                    logger.error("Error getting top metadata list: ", err);
                    return resolve([]);
                }
                return resolve(docs || []);
            });
    });
}


function getAllUsers() {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve([]);
        }
        db.find({}, function(err, users) {
            resolve(Object.values(users));
        });
    });
}

// This returns all rows from our DB for use in our UI.
function getRowsForUI() {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve();
        }
        const rowData = [];

        // Find all documents in the collection
        // Make sure the row ids you're sending back match the DB defs.
        db.find({}, function(err, users) {
            Object.keys(users).forEach(function(k, user) {
                const userEntry = users[user];
                // Push to row.
                rowData.push(userEntry);
            });
            resolve(rowData);
        });
    });
}

// This takes user input from frontend and sanitizes it for the backend.
// SANITIZE MY BACKEND EBIGGZ
async function sanitizeDbInput(changePacket) {
    if (!isViewerDBOn()) {
        return;
    }
    switch (changePacket.field) {
    case "lastSeen":
    case "joinDate":
        changePacket.value = moment(changePacket.value).valueOf();
        break;
    case "minutesInChannel":
    case "chatMessages":
        changePacket.value = parseInt(changePacket.value);
        break;
    default:
    }
    return changePacket;
}

// This will update a cell in the DB with new information.
// Change Packet: {userId: 0000, field: "username", value: "newUsername"}
function updateDbCell(changePacket) {
    if (!isViewerDBOn()) {
        return;
    }

    sanitizeDbInput(changePacket).then(function(changePacket) {
        const id = changePacket.userId,
            field = changePacket.field,
            newValue = changePacket.value;

        const updateDoc = {};
        updateDoc[field] = newValue;

        db.update({ _id: id }, { $set: updateDoc }, {}, function(err) {
            if (err) {
                logger.error("Error adding currency to user.", err);
            }
        });
    });
}

function incrementDbField(userId, fieldName) {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve();
        }

        const updateDoc = {};
        updateDoc[fieldName] = 1;
        db.update({ _id: userId, disableAutoStatAccrual: { $ne: true } }, { $inc: updateDoc }, { returnUpdatedDocs: true }, function(err, _, updatedDoc) {
            if (err) {
                logger.error(err);
            } else {
                if (updatedDoc != null) {
                    const updateObj = {};
                    updateObj[fieldName] = util.commafy(updatedDoc[fieldName]);
                }
            }
            resolve();
        });
    });
}

function updateViewerDataField(userId, field, value) {
    const updateObject = {};
    updateObject[field] = value;

    db.update({ _id: userId }, { $set: updateObject }, { returnUpdatedDocs: true }, function(err, _, updatedDoc) { //eslint-disable-line no-unused-vars
        if (err) {
            logger.error("Error updating user.", err);
        }
    });
}

//////////////////
// Event Listeners

frontendCommunicator.onAsync("getPurgePreview", (options) => {
    if (!isViewerDBOn()) {
        return Promise.resolve([]);
    }
    return getPurgeUsers(options);
});

frontendCommunicator.onAsync("purgeUsers", (options) => {
    if (!isViewerDBOn()) {
        return Promise.resolve(0);
    }
    return purgeUsers(options);
});

frontendCommunicator.onAsync("getAllViewers", () => {
    if (!isViewerDBOn()) {
        return Promise.resolve([]);
    }
    return getAllUsers();
});

frontendCommunicator.onAsync("getViewerFirebotData", (userId) => {
    return getUserById(userId);
});

frontendCommunicator.onAsync("createViewerFirebotData", data => {
    return createNewUser(data.id, data.username, data.roles);
});

frontendCommunicator.on("removeViewerFromDb", userId => {
    removeUser(userId);
});

frontendCommunicator.onAsync("getViewerDetails", (userId) => {
    return userAccess.getUserDetails(userId);
});

frontendCommunicator.on("updateViewerDataField", (data) => {
    const { userId, field, value } = data;
    updateViewerDataField(userId, field, value);
});

// Return db rows for the ui to use.
ipcMain.on("request-viewer-db", event => {
    if (!isViewerDBOn()) {
        return;
    }
    getRowsForUI().then(rows => {
        event.sender.send("viewer-db-response", rows);
    });
});


// Get change info from UI.
ipcMain.on("viewer-db-change", (event, data) => {
    if (!isViewerDBOn()) {
        return;
    }
    updateDbCell(data);
});

// Connect to the DBs
ipcMain.on("viewerDbConnect", () => {
    if (!isViewerDBOn()) {
        return;
    }
    connectUserDatabase();
    logger.debug("Connecting to user database.");
});

// Disconnect from DBs
ipcMain.on("viewerDbDisconnect", () => {
    setAllUsersOffline();
    db = null;

    // Clear the online time calc interval.
    clearInterval(updateTimeIntervalId);
    clearInterval(updateLastSeenIntervalId);

    logger.debug("Disconnecting from user database.");
});

exports.connectUserDatabase = connectUserDatabase;
exports.setChatUserOnline = setChatUserOnline;
exports.setChatUserOffline = setChatUserOffline;
exports.setAllUsersOffline = setAllUsersOffline;
exports.getUserOnlineMinutes = getUserOnlineMinutes;
exports.getUserByUsername = getUserByUsername;
exports.getUserById = getUserById;
exports.getTwitchUserByUsername = getTwitchUserByUsername;
exports.incrementDbField = incrementDbField;
exports.getUserDb = getUserDb;
exports.removeUser = removeUser;
exports.createNewUser = createNewUser;
exports.updateUser = updateUser;
exports.setChatUsersOnline = setChatUsersOnline;
exports.getTopViewTimeUsers = getTopViewTimeUsers;
exports.addNewUserFromChat = addNewUserFromChat;
exports.getOnlineUsers = getOnlineUsers;
exports.removeUserMetadata = removeUserMetadata;
exports.updateUserMetadata = updateUserMetadata;
exports.getUserMetadata = getUserMetadata;
exports.getAllUsernames = getAllUsernames;
exports.getAllUsernamesWithIds = getAllUsernamesWithIds;
exports.getTopMetadata = getTopMetadata;
exports.getTopMetadataPosition = getTopMetadataPosition;
exports.updateViewerDataField = updateViewerDataField;