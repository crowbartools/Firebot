'use strict';
const Datastore = require('nedb');
const dataAccess = require('../common/data-access');
const logger = require('../logwrapper');

let db;

function setChatUserOffline(id) {
    db.update({"_id": id}, {$set: {online: false}}, (err) => {
        if (err) {
            logger.error("Error setting chat user offline: ", err.message);
        }
    });
}

function setAllUsersOffline() {
    db.update({online: true}, {online: false}, (err) => {
        if (err) {
            logger.error("Error setting all users offline: ", err.message);
        }
    });
}

function connectUserDatabase() {
    let path = dataAccess.getPathInUserData('db/users.db');
    db = new Datastore({filename: path});
    db.loadDatabase(err => {
        if (err) {
            logger.error("Error Loading Database: ", err.message);
            logger.debug("Failed Database Path: ", path);
        }
    });
    logger.debug("User Database Loaded: ", path);
    setAllUsersOffline();
}

function setChatUserOnline(data) {
    logger.debug("Add Chat User: ", data.username);
    db.findOne({"_id": data.id}, (err, doc) => {
        if (err) {
            logger.error("Error retrieving doc for id ", data.id, ": ", err.message);
        }
        if (doc) {
            db.update({"_id": data.id}, {$set: {online: true}}, (err) => {
                logger.debug("Error setting user online: ", err.message);
                logger.debug("Errored user: ", data);
                logger.debug("Found data: ", doc);
            });
        } else {
            let ins = {
                username: data.username,
                _id: data.id,
                roles: data.roles,
                online: true,
                currency: {}
            };
            db.insert(ins, (err) => {
                logger.error("Error adding user: ", err.message);
            });
        }
    });

}

exports.setChatUserOnline = setChatUserOnline;
exports.connectUserDatabase = connectUserDatabase;
exports.setAllUsersOffline = setAllUsersOffline;
exports.setChatUserOffline = setChatUserOffline;