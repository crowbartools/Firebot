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

// Get Remaining Cooldown
// Returns the amount of time remaining for a control id.
function getRemainingCooldownTime(controlId) {
    let currentTtl = cooldownCache.getTtl(controlId) || 0;

    if (currentTtl === 0) {
        return 0;
    }

    let diff = moment(currentTtl).diff(moment());
    if (diff < 0) {
        return 0;
    }
    return diff;
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

function getControlIdsForCooldownGroups(groupIds) {
    let controlIds = [];
    let connectedProject = mixplayProjectManager.getConnectedProject();
    if (connectedProject) {
        const cooldownGroups = connectedProject.cooldownGroups.filter(
            group => groupIds.includes(group.id)
        );

        for (let cooldownGroup of cooldownGroups) {
            let cooldownGroupButtons = cooldownGroup.controlIds;
            controlIds = cooldownGroupButtons.concat(controlIds);
        }
    }

    controlIds.filter((a, b) => controlIds.indexOf(a) === b);
    return controlIds;
}

async function cooldownControls(controlIds, cooldownDuration, neverOverride) {
    if (controlIds == null) return;

    const cooldown = parseInt(cooldownDuration);

    const controlsToCooldown = [];
    for (const controlId of controlIds) {
        const shouldCooldown = checkCooldown(controlId, cooldown, neverOverride);
        if (shouldCooldown) {
            controlsToCooldown.push(controlId);
            logger.debug(`Triggering cooldown for control "${controlId}" for ${cooldown}s`);
            updateCooldownForControlId(controlId, cooldown);
        }
    }

    await mixplay.updateCooldownForControls(controlsToCooldown, cooldown * 1000);
}

// Cooldown handler
async function handleControlCooldown(control) {
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
            logger.debug(`Triggering cooldown group "${cooldownGroup.name}"`);
            await cooldownControls(cooldownGroup.controlIds, cooldownGroup.duration);
        }
    }

    if (control.mixplay.cooldown) {
        // cooldown single control with saved cooldown
        await cooldownControls([control.id], control.mixplay.cooldown);
    }

    return false;
}

async function advancedUpdate(updateData) {
    if (updateData == null) {
        return;
    }

    if (updateData.duration == null) {
        return;
    }

    const duration = parseInt(updateData.duration);
    let controlIds = [];
    if (updateData.target === "group") {
        controlIds = getControlIdsForCooldownGroups(updateData.ids);
    } else {
        controlIds = updateData.ids;
    }

    if (updateData.type === "always") {
        await mixplay.updateCooldownForControls(controlIds, duration * 1000);
        for (let controlId of controlIds) {
            updateCooldownForControlId(controlId, duration);
        }
    }

    if (updateData.type === "longer") {
        // Default type of cooldown, use standard process.
        await cooldownControls(controlIds, duration);
    }

    if (updateData.type === "shorter") {
        let shorterControlIds = [];
        for (let controlId of controlIds) {
            let remainingCooldown = getRemainingCooldownTime(controlId);
            let newCooldown = moment().add(duration, "seconds").diff(moment());

            if (newCooldown < remainingCooldown) {
                shorterControlIds.push(controlId);
            }
        }

        await mixplay.updateCooldownForControls(shorterControlIds, duration * 1000);

        for (let controlId of shorterControlIds) {
            updateCooldownForControlId(controlId, duration);
        }
    }
}

async function mathUpdate(updateData) {
    const duration = parseInt(updateData.duration) * 1000;
    let controlIds = [];
    if (updateData.target === "group") {
        controlIds = getControlIdsForCooldownGroups(updateData.ids);
    } else {
        controlIds = updateData.ids;
    }

    for (let controlId of controlIds) {
        let remainingCooldown = getRemainingCooldownTime(controlId);
        let newCooldown;

        if (updateData.type === "add") {
            newCooldown = remainingCooldown + duration;
        } else {
            newCooldown = remainingCooldown - duration;
        }

        await mixplay.updateCooldownForControls([controlId], newCooldown);
        updateCooldownForControlId(controlId, newCooldown / 1000);
    }
}

exports.getRemainingCooldownTime = getRemainingCooldownTime;
exports.handleControlCooldown = handleControlCooldown;
exports.advancedUpdate = advancedUpdate;
exports.mathUpdate = mathUpdate;
