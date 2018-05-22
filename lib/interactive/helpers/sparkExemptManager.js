'use strict';


const {ipcMain} = require('electron');
let settings = require("../../common/settings-access.js").settings;
const logger = require('../../logwrapper');
const permissions = require("../permissions.js");

let exemptUsers = [];
let exemptGroups = [];
let devExempt = ['Firebottle', 'ebiggz', 'ThePerry'];

function userIsExempt(participant) {
    return new Promise((resolve) => {
        let userName = participant.username;

        if (userName != null && userName.trim().length < 1) {
            // User name is empty. This shouldnt happen, but just to be safe.
            logger.debug('Username is empty when checking spark exempt!');
            resolve(false);
        }

        // See if user is a dev.
        if (devExempt.includes(userName)) {
            logger.info(`${userName} appears to be d-exempt. Not charging sparks.`);
            // user is a dev.
            resolve(true);
        }

        // Exempt groups and users arent being used. Dont even bother checking anything else.
        if (exemptGroups.length === 0 && exemptUsers.length === 0) {
            logger.info('No spark exempt users or groups to check against.');
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
    let sparkExemptions = settings.getSparkExemptUsers();
    exemptUsers = sparkExemptions.users;
    exemptGroups = sparkExemptions.groups;
}

ipcMain.on('sparkExemptUpdated', () => {
    loadExemptList();
});

loadExemptList();

exports.userIsExempt = userIsExempt;
