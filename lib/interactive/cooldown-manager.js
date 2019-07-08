"use strict";

const NodeCache = require("node-cache");
const logger = require('../logwrapper');
const moment = require('moment');
const mixplay = require("./mixplay");

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

// Cooldown handler
function handleControlCooldown(controlId, cooldown) {
    if (controlId == null || cooldown == null) return true;

    let expired = cooldownIsExpired(controlId);

    if (!expired) {
        return false;
    }

    //check for group cooldown
    cooldown = parseInt(cooldown);
    let shouldCooldown = checkCooldown(controlId, cooldown);
    if (shouldCooldown) {
        logger.info(
            "Cooling Down (Single control): " + controlId + " for " + cooldown
        );

        mixplay.updateCooldownForControls([controlId], cooldown * 1000);
    }

    return true;
}

exports.handleControlCooldown = handleControlCooldown;