"use strict";

const NodeCache = require("node-cache");
const logger = require('../logwrapper');
const moment = require('moment');
const mixplay = require("./mixplay");
const mixplayProjectManager = require("./mixplay-project-manager");

// This var will save the cooldown status of all controls.
const cooldownCache = new NodeCache({ stdTTL: 1, checkperiod: 5 });

// Cooldown Expire Checker
// This function checks to see if the saved time has expired or not.
// Will return true if expired, and false if not yet expired.
function cooldownIsExpired(controlId) {
    // Go look into cooldownSaved for this button
    let exists = cooldownCache.get(controlId);

    return exists == null;
}

// Cooldown Checker
// This function checks to see if a control should be cooled down or not based on current cooldown count.
// It will return true if the new cooldown is longer than what it was already.
function checkCooldown(controlId, cooldown, neverOverride = false) {

    let shouldCooldown = false;
    if (neverOverride) {
        shouldCooldown = cooldownIsExpired(controlId);
    } else {
        let currentTtl = cooldownCache.getTtl(controlId) || 0;
        let diff = moment(currentTtl).diff(moment());
        shouldCooldown = diff < cooldown * 1000;
    }

    if (shouldCooldown) {
        if (cooldown > 1) {
            cooldown -= 1;
        }
        //add cooldown
        cooldownCache.set(controlId, true, cooldown);
    }

    return shouldCooldown;
}

function updateCooldownForControlId(controlId, cooldown) {
    if (cooldown > 1) {
        cooldown -= 1;
    }

    logger.debug(`Updating internal cd for ${controlId} to ${cooldown}`);

    if (cooldown < 1) {
        cooldownCache.del(controlId);
    } else {
        cooldownCache.set(controlId, true, cooldown);
    }
}

function getCooldownGroupsContainingControl(control) {
    let connectedProject = mixplayProjectManager.getConnectedProject();
    if (connectedProject) {
        const cooldownGroups = connectedProject.cooldownGroups;
        if (cooldownGroups && cooldownGroups.length > 0) {
            return cooldownGroups.filter(cg => cg.controlIds && cg.controlIds.includes(control.id));
        }
    }
    return [];
}

function cooldownControls(controlIds, cooldownDuration, neverOverride) {
    const cooldown = parseInt(cooldownDuration);

    const controlsToCooldown = [];
    for (const controlId of controlIds) {
        const shouldCooldown = checkCooldown(controlId, cooldown, neverOverride);
        if (shouldCooldown) {
            controlsToCooldown.push(controlId);
            logger.info(`Triggering cooldown for control "${controlId}" for ${cooldown}s`);
            updateCooldownForControlId(controlId, cooldown);
        }
    }

    mixplay.updateCooldownForControls(controlsToCooldown, cooldown * 1000);
}

// Cooldown handler
function handleControlCooldown(control) {
    if (!control) return false;

    const cooldownGroupsContainingControl = getCooldownGroupsContainingControl(control);

    if (!control.mixplay.cooldown && cooldownGroupsContainingControl.length < 1) {
        // this control doesnt have any cooldowns
        return false;
    }

    let expired = cooldownIsExpired(control.id);

    if (!expired) {
        // return true to indicate control is already on cooldown
        return true;
    }

    if (cooldownGroupsContainingControl.length > 0) {
        // sort cooldownGroups by longest cooldown
        cooldownGroupsContainingControl.sort((a, b) => b.duration - a.duration);
        for (const cooldownGroup of cooldownGroupsContainingControl) {
            logger.info(`Triggering cooldown group "${cooldownGroup.name}"`);
            cooldownControls(cooldownGroup.controlIds, cooldownGroup.duration);
        }
    }

    if (control.mixplay.cooldow) {
        // cooldown single control with saved cooldown
        cooldownControls([control.id], control.mixplay.cooldown);
    }

    return false;
}

exports.handleControlCooldown = handleControlCooldown;