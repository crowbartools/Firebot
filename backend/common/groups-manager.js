"use strict";

const profileManager = require("./profile-manager.js");
const logger = require("../logwrapper");

/**
 * A user created custom viewer group
 * @typedef {Object} CustomGroup
 * @property {string} id - The id of the group.
 * @property {string} name - The display name of the group.
 * @property {string} description - Description of the role.
 * @property {number} rank - The hierarchy rank of this role. Used for determining the highest ranked group a viewer has.
 * @property {string[]} viewers - An array of viewer names that are in this group.
 */

/**
 *  An array of user created custom viewer groups
 *  @type {CustomGroup[]}
 * */
let customGroups = [];

/**
 * A mixer defined user role
 * @typedef {Object} MixerRole
 * @property {string} id - The id of the mixer role.
 * @property {string} name - The display name of the mixer role.
 * @property {string} description - Description of the role.
 * @property {number} rank - The hierarchy rank of this role. Used for determining the highest ranked role a viewer has.
 * @property {number} defaultRank - The default rank for this role.
 * @property {number} isMixplayOnly - Whether or not this role/group is only applicable for MixPlay
 */

/**
 * An array of mixer roles/groups
 *  @type {MixerRole[]}
 * */
let mixerRoles = [
    {
        id: "anonymous",
        name: "Anonymous",
        description: "A viewer who isn't signed into Mixer",
        isMixplayOnly: true
    },
    {
        id: "Pro",
        name: "Pro",
        description: "Viewers who have Mixer Pro",
        defaultRank: 6
    },
    {
        id: "Subscriber",
        name: "Subscribers",
        description: "Viewers who are subscribed to your channel",
        defaultRank: 5
    },
    {
        id: "Mod",
        name: "Moderators",
        description: "Moderators of your channel",
        defaultRank: 4
    },
    {
        id: "ChannelEditor",
        name: "Channel Editors",
        description: "Viewers who are channel editors",
        defaultRank: 3
    },
    {
        id: "Staff",
        name: "Staff",
        description: "Mixer staff members",
        defaultRank: 2
    },
    {
        id: "Owner",
        name: "Streamer",
        description: "Your streamer account",
        defaultRank: 1
    }
];

/**
 * An array of banned usernames
 * @type {string[]}
 */
let bannedViewers = [];

function getGroupsFile() {
    return profileManager.getJsonDbInProfile("/groups");
}

function getDataFromFile(path) {
    let data = null;
    try {
        data = getGroupsFile().getData(path);
    } catch (err) {
        logger.error("error getting groups from file", err);
    }
    return data;
}

function loadGroups() {
    let groupData = getDataFromFile("/");

    if (groupData == null) return;

    if (groupData.customGroups) {
        customGroups = Object.values(groupData.customGroups);
    }
}