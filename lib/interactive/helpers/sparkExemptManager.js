'use strict';


const {ipcMain} = require('electron');
let settings = require("../../common/settings-access.js").settings;
const logger = require('../../logwrapper');
const permissions = require("../permissions.js");

let exemptUsers = [];
let exemptGroups = [];
let useExemption = false;

// Returns the use Exemption variable which is used to see if we need to check for exemption status or not.
function checkUseExemption() {
    return useExemption;
}

function userIsExempt(participant) {
    return new Promise((resolve) => {
        let userName = participant.username;

        if (userName != null && userName.trim().length < 1) {
            // User name is empty. This shouldnt happen, but just to be safe.
            logger.info('Username is empty when checking spark exempt!');
            resolve(false);
        }

        // we have exempt usernames to check against.
        if (exemptUsers.length > 0) {
            if (exemptUsers.includes(userName)) {
                // user is in the exempt user list!
                logger.info(`${userName} is on exempt list. Not charging sparks. Exempt users: ${exemptUsers.join()}`);
                resolve(true);
            }
        }

        // If 'Default' is selected as spark exempt, that means no one should be charged sparks.
        if (exemptGroups.includes('default')) {
            logger.info('Default group is selected as spark exempt. Free buttons for everyone!');
            resolve(true);
        }

        // Okay, now the hard part. Let's test to see if they're in an exempt group.
        permissions.getUserRoles(participant)
            .then((userRoles) => {
                let combinedRoles = permissions.getCombinedRoles(participant.username, userRoles),
                    exemptGroupMap = permissions.mapRoleNames(exemptGroups);

                if (exemptGroupMap.length === 0 || exemptGroupMap.every(g => g == null || g.trim() === "")) {
                    logger.info(`No exempt groups saved. Skipping exempt check.`);
                    resolve(false);
                } else {
                    // Okay, if they passed then don't charge sparks.
                    if (permissions.userIsInRole(combinedRoles, exemptGroupMap)) {
                        // user is in one or more of the exempt groups!
                        logger.info(`${userName} is in an exempt group or is the owner. Not charging sparks. Exempt groups: ${exemptGroupMap}, user groups: ${combinedRoles}`);
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }

            })
            .catch((err) => {
                logger.error(err);
                renderWindow.webContents.send('error', "There was an error trying to get user roles from chat for spark exemptions." + err);
                resolve(false);
            });
    });
}

function loadExemptList() {
    logger.info('Updating spark exemption lists...');
    let sparkExemptions = settings.getSparkExemptUsers();
    exemptUsers = sparkExemptions.users;
    exemptGroups = sparkExemptions.groups;

    // Check users and groups to see if we need to use exemption or not.
    if (exemptUsers.length > 0 || exemptGroups.length > 0) {
        logger.info('We have spark exempt users or groups. Setting "use exemption" to true.');
        useExemption = true;
    } else {
        logger.info('We do not have spark exempt users or groups. Leaving "use exemption" as false.');
    }
}



ipcMain.on('sparkExemptUpdated', () => {
    loadExemptList();
});

loadExemptList();

exports.userIsExempt = userIsExempt;
exports.checkUseExemption = checkUseExemption;