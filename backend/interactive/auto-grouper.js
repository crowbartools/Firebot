'use strict';

const logger = require('../logwrapper');
const profileManager = require("../common/profile-manager.js");
const groupAccess = require('../common/groups-access');
const Interactive = require('../common/mixer-interactive');
const permissions = require("./permissions");

const NodeCache = require("node-cache");

const groupCache = new NodeCache({ stdTTL: 10, checkperiod: 10 });

function loadActiveGroupsFromFile() {
    let activeGroups = [];
    /*try {
        // Get last board name.
        let dbSettings = profileManager.getJsonDbInProfile("/settings"),
            gameName = dbSettings.getData("/interactive/lastBoardId"),
            dbControls = profileManager.getJsonDbInProfile(`/controls/${gameName}`);

        let scenes = dbControls.getData('./firebot/scenes');

        if (scenes && scenes instanceof Object) {

            let scenesArray = Object.values(scenes);

            // get scenes, filter out scenes that dont have default array,
            // and then map array to just the default groups list
            let groups = scenesArray
                .filter(s => s.default && Array.isArray(s.default) && s.default.length > 0)
                .map(s => s.default);


            // flatten groups into one master array
            groups = [].concat(...groups);

            //remove duplicates
            activeGroups = [...new Set(groups)];
        }
    } catch (err) {
        logger.warn("Couldnt get active scenes from file", err);
    }*/

    return activeGroups;
}

function getActiveGroups() {
    logger.debug("Getting active groups.");

    let activeGroups = [];

    let cachedGroups = groupCache.get("groups");
    if (cachedGroups) {
        activeGroups = cachedGroups;
    } else {
        activeGroups = loadActiveGroupsFromFile();
        groupCache.set("groups", activeGroups);
    }

    logger.debug("Active groups are: ", activeGroups);

    return activeGroups;
}

function groupParticipant(participant) {
    // if we dont got a participant, we dont gotta do anythin'
    if (participant == null) return;

    // sanity check
    // Note(ebiggz): is this overkill?
    let interactiveConnected = Interactive.getInteractiveStatus();
    if (!interactiveConnected) {
        logger.warn("Thats weird. We attempted to group a participant but interactive isn't connected.", participant);
    }

    // grab groups that are "active" ie groups that have been associated to a scene by the user
    let activeGroups = getActiveGroups();

    // If there are no active groups assigned to scenes, our job is done.
    if (activeGroups.length < 1) {
        logger.debug("No active groups detected, stopping auto group.");
        return;
    }

    // Check custom groups (groups created by the user within firebot) against active groups first
    // Note (ebiggz): We are checking custom groups first because thats what the old auto grouper did previously
    // and I want to avoid changing behavior too drastically as to not break current setups
    let viewerCustomGroups = groupAccess.getGroupsForUser(participant.username).map((g) => {
        return g.groupName;
    });

    let targetGroup;

    let foundCustomMatch = viewerCustomGroups.find(cg => activeGroups.includes(cg));
    if (foundCustomMatch) {
        // this user is in a custom group that is active
        targetGroup = foundCustomMatch;
    } else {
        // no custom groups matched, check mixer groups (Pro, Sub, Mod, etc)

        let channelGroups = participant.channelGroups;
        logger.debug("partipant channel groups: ", channelGroups);

        if (channelGroups != null && channelGroups.length > 0) {

            let mappedGroups = permissions.mapChannelRolesToFirebot(channelGroups);

            // Consider the highest group user is in as the "main" group (ie if the user is Sub and Mod, Mod is picked)
            // Down the road in v5, it might be preferable to check all groups
            let mainGroup = mappedGroups[mappedGroups.length - 1];
            logger.info(`${participant.username} main group: ${mainGroup}`);

            // we found a mixer role match with an active group
            let foundNativeGroup = activeGroups.find(g => g != null && mainGroup != null && g === mainGroup);
            if (foundNativeGroup) {
                targetGroup = foundNativeGroup;
            }

        } else {
            logger.info("User has no channel groups.");
        }
    }

    let eventMsg;
    if (targetGroup) {
        // send group change to mixer
        Interactive.changeGroups(participant, targetGroup);

        // log some info
        logger.info(`Found active group match for ${participant.username}, placing in ${targetGroup}`);

        eventMsg = `was placed into the ${targetGroup} group.`;
    } else {
        // dont do anything, log some info
        logger.info(`Could not active group match for ${participant.username}, keeping in 'default'`);

        eventMsg = "will remain in the 'default' group.";
    }

    // Sent an event log to UI
    renderWindow.webContents.send('eventlog', {
        type: "general",
        username: participant.username,
        event: eventMsg
    });
}

// Exports
exports.groupParticipant = groupParticipant;