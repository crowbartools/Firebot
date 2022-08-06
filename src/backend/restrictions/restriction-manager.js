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
        const idConflict = this._registeredRestrictions.some(
            r => r.definition.id === restriction.definition.id
        );

        if (idConflict) {
            logger.warn(`Could not register restriction '${restriction.definition.id}', a restriction with this id already exists.`);
            return;
        }

        this._registeredRestrictions.push(restriction);

        logger.debug(`Registered Restriction ${restriction.definition.id}`);

        this.emit("restrictionRegistered", restriction);
    }

    getRestrictionById(restrictionId) {
        return this._registeredRestrictions.find(r => r.definition.id === restrictionId);
    }

    getAllRestrictions() {
        return this._registeredRestrictions;
    }

    checkPermissionsPredicateOnly(restrictionData, username, twitchRoles) {
        if (restrictionData == null || restrictionData.restrictions == null ||
            restrictionData.restrictions.length < 1) {
            return Promise.resolve(true);
        }
        const restrictions = restrictionData.restrictions;
        const permissions = restrictions.filter(r => r.type === "firebot:permissions");
        if (permissions == null) {
            return Promise.resolve(true);
        }

        const permRestrictionData = {
            restrictions: permissions,
            mode: restrictionData.mode
        };

        const triggerData = {
            metadata: {
                username: username,
                userTwitchRoles: twitchRoles
            }
        };
        return this.runRestrictionPredicates(triggerData, permRestrictionData)
            .then(() => true, () => false);
    }

    async runRestrictionPredicates(triggerData, restrictionData) {
        if (restrictionData == null || restrictionData.restrictions == null ||
            restrictionData.restrictions.length < 1) {
            return Promise.resolve();
        }
        const restrictions = restrictionData.restrictions;

        if (restrictionData.mode === "any" || restrictionData.mode === "none") {
            const reasons = [];
            let restrictionPassed = false;
            for (const restriction of restrictions) {
                const restrictionDef = this.getRestrictionById(restriction.type);
                if (restrictionDef && restrictionDef.predicate) {
                    try {
                        await restrictionDef.predicate(triggerData, restriction);
                        restrictionPassed = true;
                        if (restrictionData.mode !== "none" && restrictionDef.onSuccessful) {
                            restrictionDef.onSuccessful(triggerData, restriction);
                        }
                        break;
                    } catch (reason) {
                        if (reason) {
                            reasons.push(reason.toLowerCase());
                        }
                    }
                }
            }

            if (restrictionData.mode === "none") {
                if (restrictionPassed) {
                    return Promise.reject(`You don't meet the requirements.`);
                }
                return Promise.resolve();
            }

            //restrictionData.mode === "any"
            if (!restrictionPassed) {
                return Promise.reject(reasons.join(", or "));
            }
            return Promise.resolve();

        } else if (restrictionData.mode !== "any" && restrictionData.mode !== "none") {
            const predicatePromises = [];
            for (const restriction of restrictions) {
                const restrictionDef = this.getRestrictionById(restriction.type);
                if (restrictionDef && restrictionDef.predicate) {
                    predicatePromises.push(restrictionDef.predicate(triggerData, restriction));
                }
            }

            return Promise.all(predicatePromises).then(() => {
                for (const restriction of restrictions) {
                    const restrictionDef = this.getRestrictionById(restriction.type);
                    if (restrictionDef && restrictionDef.onSuccessful) {
                        restrictionDef.onSuccessful(triggerData, restriction);
                    }
                }
            });
        }
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
    logger.debug("got 'get restrictions' request");

    event.returnValue = manager.getAllRestrictions().map(r => mapRestrictionForFrontEnd(r));
});

module.exports = manager;
