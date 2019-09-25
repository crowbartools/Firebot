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
        return this._registeredRestrictions.find(r => r.definition.id === restrictionId);
    }

    getAllRestrictions() {
        return this._registeredRestrictions;
    }

    checkPermissionsPredicateOnly(restrictionData, username, mixerRoles) {
        if (restrictionData == null || restrictionData.restrictions == null ||
            restrictionData.restrictions.length < 1) {
            return Promise.resolve(true);
        }
        let restrictions = restrictionData;
        let permissions = restrictions.find(r => r.type === "firebot:permissions");
        if (permissions == null) {
            return Promise.resolve(true);
        }
        let triggerData = {
            metadata: {
                username: username,
                userMixerRoles: mixerRoles
            }
        };
        return this.runRestrictionPredicates(triggerData, [permissions])
            .then(() => true, () => false);
    }

    runRestrictionPredicates(triggerData, restrictionData) {
        if (restrictionData == null || restrictionData.restrictions == null ||
            restrictionData.restrictions.length < 1) {
            return Promise.resolve();
        }
        let restrictions = restrictionData.restrictions;
        let predicatePromises = [];
        for (let restriction of restrictions) {
            let restrictionDef = this.getRestrictionById(restriction.type);
            if (restrictionDef && restrictionDef.predicate) {
                predicatePromises.push(restrictionDef.predicate(triggerData, restriction));
            }
        }

        return Promise.all(predicatePromises)
            .then(() => {
                for (let restriction of restrictions) {
                    let restrictionDef = this.getRestrictionById(restriction.type);
                    if (restrictionDef && restrictionDef.onSuccessful) {
                        restrictionDef.onSuccessful(triggerData, restriction);
                    }
                }
            });
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
