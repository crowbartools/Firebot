"use strict";

const { ipcMain } = require("electron");
let settings = require("../../common/settings-access.js").settings;
const logger = require("../../logwrapper");

let exemptUsers = [];
let exemptGroups = [];
let hasExemptUsersOrGroups = false;
let sparkExemptionEnabled = false;


function userIsExempt(participant) {
    logger.info(`Checking if ${participant.username} is exempt...`);
    let userName = participant.username;

    if (userName == null || userName.trim().length < 1) {
        // User name is empty. This shouldnt happen, but just to be safe.
        logger.info('Username is empty when checking spark exempt!');
        return false;
    }

    logger.info(`Checking for exempt users...`);

    // we have exempt usernames to check against.
    if (exemptUsers != null && exemptUsers.length > 0) {
        logger.info(`We have exempt users to check. Exempt users: ${exemptUsers.join()}`);
        if (exemptUsers.includes(userName.toLowerCase())) {
            // user is in the exempt user list!
            logger.info(`${userName} is on exempt list. Not charging sparks.`);
            return true;
        }
    }

    // If 'Default' is selected as spark exempt, that means no one should be charged sparks.
    if (exemptGroups != null && exemptGroups.includes('default')) {
        logger.info('Default group is selected as spark exempt. Free buttons for everyone!');
        return true;
    }

    logger.info(`Checking channel groups...`);
    let userRoles = participant.channelGroups;

    // TODO: Rewrite this to work in V5 when we reimplement Spark Exemptions

    /*let combinedRoles = permissions.getCombinedRoles(participant.username, userRoles),
        exemptGroupMap = permissions.mapRoleNames(exemptGroups);

    if (exemptGroupMap.length === 0 || exemptGroupMap.every(g => g == null || g.trim() === "")) {
        logger.info(`No exempt groups saved. Skipping exempt check.`);
        return false;
    }
    // Okay, if they passed then don't charge sparks.
    if (permissions.userIsInRole(combinedRoles, exemptGroupMap, true)) {
        // user is in one or more of the exempt groups!
        logger.info(`${userName} is in an exempt group. Not charging sparks. Exempt groups: ${exemptGroupMap}, user groups: ${combinedRoles}`);
        return true;
    }*/

    logger.info(`User doesnt appear to be exempt!`);
    return false;
}

function loadExemptList() {
    logger.info('Updating spark exemption lists...');
    let sparkExemptions = settings.getSparkExemptUsers();
    exemptUsers = sparkExemptions.users;
    exemptGroups = sparkExemptions.groups;

    if (exemptUsers != null && Array.isArray(exemptUsers)) {
        exemptUsers = exemptUsers.map(u => u.toLowerCase().trim());
    }

    // Check users and groups to see if we need to use exemption or not.
    if ((exemptUsers != null && exemptUsers.length > 0) || (exemptGroups != null && exemptGroups.length > 0)) {
        logger.info('We have spark exempt users or groups. Setting "use exemption" to true.');
        hasExemptUsersOrGroups = true;
    } else {
        logger.info('We do not have spark exempt users or groups. Setting "use exemption" as false.');
        hasExemptUsersOrGroups = false;
    }
}

ipcMain.on("sparkExemptUpdated", () => {
    loadExemptList();
});

ipcMain.on('sparkExemptionToggled', (_, value) => {
    if (value === true) {
        logger.info("Enabled Spark Exemptions.");
        sparkExemptionEnabled = true;
    } else {
        logger.info("Disabled Spark Exemptions.");
        sparkExemptionEnabled = false;
    }
});

// on first load
let isEnabled = settings.sparkExemptionEnabled();
if (isEnabled === true) {
    sparkExemptionEnabled = true;
}

loadExemptList();

exports.userIsExempt = userIsExempt;
exports.hasExemptUsersOrGroups = () => hasExemptUsersOrGroups;
exports.sparkExemptionEnabled = () => sparkExemptionEnabled;