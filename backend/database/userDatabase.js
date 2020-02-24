"use strict";
const Datastore = require("nedb");
const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");
const moment = require("moment");
const { ipcMain } = require("electron");
const { settings } = require("../common/settings-access.js");
const currencyDatabase = require("./currencyDatabase");
const mixerChat = require('../common/mixer-chat');
const mixplay = require("../interactive/mixplay");
const frontendCommunicator = require("../common/frontend-communicator");
const userAccess = require("../common/user-access");
const channelAccess = require("../common/channel-access");
const eventManager = require("../live-events/EventManager");
const accountAccess = require("../common/account-access");
const util = require("../utility");

/**
 * @type Datastore
 */
let db;
let updateTimeIntervalId;
let updateLastSeenIntervalId;
let dbCompactionInterval = 30000;

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

//look up user object by name
function getUserByUsername(username) {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve();
        }

        let searchTerm = new RegExp(username, 'gi');

        db.findOne({ username: { $regex: searchTerm } }, (err, doc) => {
            if (err) {
                return resolve(false);
            }
            return resolve(doc);
        });
    });
}

//look up user object by id
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

//function to escape regex characters for search
function escape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"); // eslint-disable-line no-useless-escape
}

//returns array of users based on fragment of username
function searchUsers(usernameFragment) {
    return new Promise((resolve, reject) => {
        if (!isViewerDBOn()) {
            return resolve();
        }
        db.find({ username: new RegExp("/" + escape(usernameFragment) + "/") }, (docs, err) => {
            if (err) {
                reject(err.message);
            }
            resolve(docs);
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
 * Triggers a View Time Update event and updates MixPlay participant if view time hours has increased
 */
function userViewTimeUpdate(user, previousTotalMinutes, newTotalMinutes) {
    if (user == null) return;
    let previousHours = previousTotalMinutes > 0 ? parseInt(previousTotalMinutes / 60) : 0;
    let newHours = newTotalMinutes > 0 ? parseInt(newTotalMinutes / 60) : 0;
    if (newHours < 1) return;
    if (newHours !== previousHours) {

        mixplay.updateParticipantWithData(user._id, {
            viewTime: `${util.commafy(newHours)} hrs`
        });

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
    db.find({ online: true }, (err, docs) => {
        if (!err) {
            docs.forEach(user => calcUserOnlineMinutes(user));
        }
    });
}

function removeUser(userId) {
    if (userId == null) return;
    db.remove({ _id: userId }, {}, function (err) {
        if (err) {
            logger.warn("Failed to remove user from DB", err);
        }
    });
}

function createNewUser(userId, username, channelRoles, isOnline = false) {
    return new Promise(resolve => {
        if (!isViewerDBOn()) {
            return resolve(null);
        }

        let streamerUserId = accountAccess.getAccounts().streamer.userId;
        let botUserId = accountAccess.getAccounts().bot.userId;

        let disableAutoStatAccrual = userId === streamerUserId || userId === botUserId;

        let user = {
            username: username,
            _id: userId,
            roles: channelRoles,
            online: isOnline,
            onlineAt: Date.now(),
            lastSeen: Date.now(),
            joinDate: Date.now(),
            minutesInChannel: 0,
            mixplayInteractions: 0,
            chatMessages: 0,
            disableAutoStatAccrual: disableAutoStatAccrual,
            disableActiveUserList: false,
            currency: {},
            ranks: {}
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
                resolve(user);
            }
        });
    });
}

//create a user from mixer user data
async function createUserFromChat(data, isOnline = true) {
    return await createNewUser(data.id, data.username, data.roles, isOnline);
}

//set a user online
function setUserOnline(user) {
    return new Promise((resolve, reject) => {
        if (!isViewerDBOn()) {
            return resolve();
        }

        if (!user.online) {
            user.online = true;
            user.onlineAt = Date.now();
            user.lastSeen = Date.now();
            db.update({ _id: user._id }, user, (err, _, affectedDocuments) => {
                if (err) {
                    logger.debug("Error setting user online: ", err.message);
                    logger.debug("Errored user: ", affectedDocuments);
                    reject();
                }
            });
            resolve(user);
        }
    });
}

//set a user online or add them to the database as online
function setChatUserOnline(data) {
    return new Promise((resolve, reject) => {
        if (!isViewerDBOn()) {
            return resolve();
        }
        getUserById(data.id).then(
            async user => {
                if (user) {
                    logger.debug("ViewerDB: User exists in DB, setting online: ", data.username);
                    user.roles = data.roles; // Update user roles when they go online.
                    setUserOnline(user).then(user => resolve(user), err => reject(err));
                } else {
                    logger.debug(
                        "ViewerDB: Adding Chat User to DB and setting online: ",
                        data.username
                    );
                    await createUserFromChat(data, true);

                    resolve();
                }
            },
            err => {
                logger.error("Unable to set user online.", err);
                resolve();
            }
        );
    });
}

// Sets chat users online using the same function we use to get the chat viewer list for the ui.
function setChatUsersOnline() {
    mixerChat.getCurrentViewerListV2().then((viewerList) => {
        for (let viewer of viewerList) {

            // Here we convert the viewer list viewer object to one that matches
            // what we get from chat messages...
            let viewerPacket = {
                id: viewer.userId,
                username: viewer.username,
                roles: viewer.user_roles
            };

            setChatUserOnline(viewerPacket);
        }
    });
}

//set user offline, update time spent records
function setChatUserOffline(id) {
    return new Promise((resolve, reject) => {
        if (!isViewerDBOn()) {
            return resolve();
        }

        // Find the user by id to get their minutes viewed.
        // Update their minutes viewed with our new times.
        db.find({ _id: id }, (err, user) => {

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

//establish the connection, set everyone offline, start last seen timer
function connectUserDatabase() {
    logger.info('ViewerDB: Trying to connect to user database...');
    if (!isViewerDBOn()) {
        return;
    }

    let path = profileManager.getPathInProfile("db/users.db");
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
        let rowData = [];

        // Find all documents in the collection
        // Make sure the row ids you're sending back match the DB defs.
        db.find({}, function(err, users) {
            Object.keys(users).forEach(function(k, user) {
                let userEntry = users[user];
                // Push to row.
                rowData.push(userEntry);
            });
            resolve(rowData);
        });
    });
}

// This takes user input from frontend and sanitizes it for the backend.
// SANITIZE MY BACKEND EBIGGZ
function sanitizeDbInput(changePacket) {
    return new Promise((resolve, reject) => {
        if (!isViewerDBOn()) {
            return resolve();
        }
        switch (changePacket.field) {
        case "lastSeen":
        case "joinDate":
            changePacket.value = moment(changePacket.value).valueOf();
            break;
        case "minutesInChannel":
        case "mixPlayInteractions":
        case "chatMessages":
            changePacket.value = parseInt(changePacket.value);
            break;
        default:
        }
        resolve(changePacket);
    });
}

// This will update a cell in the DB with new information.
// Change Packet: {userId: 0000, field: "username", value: "newUsername"}
function updateDbCell(changePacket) {
    if (!isViewerDBOn()) {
        return;
    }

    sanitizeDbInput(changePacket).then(function(changePacket) {
        let id = changePacket.userId,
            field = changePacket.field,
            newValue = changePacket.value;

        let updateDoc = {};
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

        let updateDoc = {};
        updateDoc[fieldName] = 1;
        db.update({ _id: userId, disableAutoStatAccrual: { $ne: true } }, { $inc: updateDoc }, { returnUpdatedDocs: true }, function(err, _, updatedDoc) {
            if (err) {
                logger.error(err);
            } else {
                if (updatedDoc != null) {
                    let updateObj = {};
                    updateObj[fieldName] = util.commafy(updatedDoc[fieldName]);
                    mixplay.updateParticipantWithData(userId, updateObj);
                }
            }
            resolve();
        });
    });
}

//////////////////
// Event Listeners

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

frontendCommunicator.onAsync("updateUserHearts", (data) => {
    const { userId, amount } = data;
    return channelAccess.giveHeartsToUser(userId, amount);
});

frontendCommunicator.on("updateViewerRole", (data) => {
    const { userId, role, addOrRemove } = data;
    channelAccess.updateUserRole(userId, role, addOrRemove);
});

frontendCommunicator.on("toggleFollowOnChannel", (data) => {
    const { channelIdToFollow, shouldFollow } = data;
    channelAccess.toggleFollowOnChannel(channelIdToFollow, shouldFollow);
});

frontendCommunicator.on("updateViewerDataField", (data) => {
    const { userId, field, value } = data;

    let updateObject = {};
    updateObject[field] = value;

    db.update({ _id: userId }, { $set: updateObject }, { returnUpdatedDocs: true }, function(err, _, updatedDoc) {
        if (err) {
            logger.error("Error updating user.", err);
        } else {
            if (updatedDoc != null) {
                mixplay.updateParticipantWithUserData(updatedDoc);
            }
        }
    });
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
ipcMain.on("viewerDbConnect", event => {
    if (!isViewerDBOn()) {
        return;
    }
    connectUserDatabase();
    logger.debug("Connecting to user database.");
});

// Disconnect from DBs
ipcMain.on("viewerDbDisconnect", (event, data) => {
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
exports.incrementDbField = incrementDbField;
exports.getUserDb = getUserDb;
exports.setChatUsersOnline = setChatUsersOnline;
exports.getTopViewTimeUsers = getTopViewTimeUsers;