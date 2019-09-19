"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const EventEmitter = require("events");

class RestrictionsManager extends EventEmitter {
    constructor() {
        super();

        this._registeredRestrictions = [];
    }

    registerRestriction(restriction) {
        let idConflict = this._registeredRestrictions.some(
            r => r.id === restriction.id
        );

        if (idConflict) {
            logger.warning(`Could not register restriction '${restriction.id}', a restriction with this id already exists.`);
            return;
        }

        this._registeredRestrictions.push(restriction);

        logger.debug(`Registered Restriction ${restriction.id}`);

        this.emit("restrictionRegistered", restriction);
    }

    getRestrictionById(restrictionId) {
        return this._registeredRestrictions.find(r => r.id === restrictionId);
    }

    getAllRestrictions() {
        return this._registeredRestrictions;
    }
}

const manager = new RestrictionsManager();

function mapRestrictionForFrontEnd(restriction) {
    return {
        definition: restriction.definition,
        optionsTemplate: restriction.optionsTemplate,
        optionsControllerRaw: restriction.optionsController ?
            restriction.optionsController.toString() : '() => {}',
        optionsValueDisplayRaw: restriction.optionsValueDisplay ?
            restriction.optionsValueDisplay.toString() : "() => ''"
    };
}

ipcMain.on("getRestrictions", (event) => {
    logger.info("got 'get restrictions' request");

    event.returnValue = manager.getAllRestrictions().map(r => mapRestrictionForFrontEnd(r));
});

module.exports = manager;
