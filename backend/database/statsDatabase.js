"use strict";
const Datastore = require("nedb");
const profileManager = require("../common/profile-manager");
const logger = require("../logwrapper");
const { app } = require("electron");

let db;

function connectStatsDatabase() {
    let path = profileManager.getPathInProfile("db/stats.db");
    db = new Datastore({ filename: path });
    db.loadDatabase(err => {
        if (err) {
            logger.error("Error Loading Database: ", err.message);
            logger.debug("Failed Database Path: ", path);
        }
    });
}

let EventType = {
    EFFECT_RAN: "effectRan",
    CONTROL_PRESSED: "controlPressed",
    COMMAND_ISSUED: "commandIssued",
    CUSTOM_SCRIPT: "customScript",
    TIMED_COMMAND_ISSUED: "timedCommandIssued",
    TIMER: "timerFired",
    EVENT_TRIGGERED: "eventTriggered",
    HOTKEY_PRESSED: "hotkeyPressed",
    VIEWER_BANNED: "viewerBanned",
    SPARKS_TRANSACTED: "sparksTransacted"
};

// Insert a record into the statabase.
function insertStatRecord(eventType, userId, meta) {
    if (!Object.keys(EventType).includes(eventType)) {
        return;
    }

    meta.event = eventType;

    let ins = {
        userid: userId,
        date: Date.now(),
        version: app.getVersion(),
        meta: meta
    };

    // Insert this record into the stats database.
    db.insert(ins, err => {
        if (err) {
            logger.error("Error adding user: ", err.message);
        }
    });
}

exports.connectStatsDatabase = connectStatsDatabase;
exports.insertStatRecord = insertStatRecord;
exports.EventType = EventType;
