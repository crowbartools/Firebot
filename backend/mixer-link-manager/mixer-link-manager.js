'use strict';

/*const Datastore = require('nedb');
const logger = require('../logwrapper');
const profileManager = require('../common/profile-manager');
const frontendCommunicator = require("../common/frontend-communicator");

let db, loader;

function loadLinkDatabase() {
    // todo
}
function isLinkPending(twitchid) {
    // todo
}
function isLinked(twitchid) {
    // todo
}
function link(twitchid, mixername) {
    // todo
}
function unlink(twitchid) {
    // todo
}

function factory() {

    // factory has already been called; return the loader promise
    if (loader) {
        return loader;
    }

    // get path to db
    let path = profileManager.getPathInProfile("db/mixerlinks.db");

    // create the db instance
    db = new Datastore({ filename: path });

    // attempt to load the db
    loader = new Promise((resolve, reject) => {
        db.loadDatabase(err => {

            // failed to load the db
            if (err) {
                logger.error("Error Loading Database: ", err.message);
                logger.debug("Failed Database Path: ", path);
                reject(err);

            // db loaded
            } else {
                resolve({
                    loadLinkDatabase,
                    isLinkPending,
                    isLinked,
                    link,
                    unlink
                });
            }
        });
    });

    return loader;
}

frontendCommunicator.onAync('mixer-link-get-all', async () => {
    // todo
});

frontendCommunicator.on('mixer-link-set', (twitchid, mixername) => {
    // todo
});

frontendCommunicator.on('mixer-link-unlink', twitchid => {
    // todo
});


module.exports = factory;*/