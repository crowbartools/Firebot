'use strict';

const logger = require('../logwrapper');
const Interactive = require('../common/mixer-interactive');
const dataAccess = require('../common/data-access.js');
const groupAccess = require('../common/groups-access');
const permissions = require("./permissions");

function getActiveGroups() {
    logger.info("Getting active groups.");

    let scenes;
    try {
        // Get last board name.
        let dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings"),
            gameName = dbSettings.getData('/interactive/lastBoardId'),
            dbControls = dataAccess.getJsonDbInUserData(`/user-settings/controls/${gameName}`);

        scenes = dbControls.getData('./firebot/scenes');
    } catch (err) {
        logger.warn("Couldnt get active scenes from file", err);
        return [];
    }

    let activeGroups = [];

    if (scenes && scenes instanceof Object) {

        let scenesArray = Object.values(scenes);

        let groups = scenesArray
            .filter(s => s.default && Array.isArray(s.default) && s.default.length > 0) // filter out scenes that dont have default array
            .map(s => s.default); // map array to new array of default group arrays


        // flatten groups into one master array
        groups = [].concat(...groups);

        activeGroups = [...new Set(groups)]; //remove duplicates
    }

    logger.debug("Active groups are: ", activeGroups);

    return activeGroups;
}

function groupParticipant(participant) {
    if (participant == null) return;

    let interactiveConnected = Interactive.getInteractiveStatus();
    if (!interactiveConnected) {
        logger.warn("Thats weird. We attempted to group a participant but interactive isn't connected.", participant);
    }

    let activeGroups = getActiveGroups();

    // check for custom groups first to mimic previous behavior. I want to avoid changing it too drastically as to not
    // break current setups
    let viewerCustomGroups = groupAccess.getGroupsForUser(participant.username).map((g) => {
        return g.groupName;
    });

    let foundCustomMatch = viewerCustomGroups.find(cg => activeGroups.includes(cg));

    let targetGroup;

    if (foundCustomMatch) {
        targetGroup = foundCustomMatch;
    } else {
        // no custom groups matched, check native groups

        logger.debug("partipant channel groups: ", participant.channelGroups);
        if (participant.channelGroups != null && participant.channelGroups.length > 0) {

            // grabbing first group user is in to, again, replciate previous behavior.
            // might be preferable to check all roles in v5
            let mappedGroups = permissions.mapChannelRolesToFirebot(participant.channelGroups).reverse();

            let mainGroup = mappedGroups[0];
            logger.info(`${participant.username} main group: ${mainGroup}`);

            let foundNativeGroup = activeGroups.find(g => g != null && mainGroup != null && g === mainGroup);

            if (foundNativeGroup) {
                targetGroup = foundNativeGroup;
            }

        } else {
            logger.info("User has no channel groups.");
        }
    }

    if (targetGroup) {
        // User is a staff member and staff group is active.
        Interactive.changeGroups(participant, targetGroup);

        logger.info(`Found active group match for ${participant.username}, placing in ${targetGroup}`);
        // Log Event
        renderWindow.webContents.send('eventlog', {type: "general", username: participant.username, event: `was placed into the ${targetGroup} group.`});
    } else {
        logger.info(`Could not active group match for ${participant.username}, keeping in 'default'`);
        renderWindow.webContents.send('eventlog', {type: "general", username: participant.username, event: "will remain in the 'default' group."});
    }
}

// Exports
exports.groupParticipant = groupParticipant;
