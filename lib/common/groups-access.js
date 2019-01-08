'use strict';

const dataAccess = require('./data-access.js');
const logger = require('../logwrapper');
const NodeCache = require("node-cache");

const groupCache = new NodeCache({ stdTTL: 10, checkperiod: 10 });

function getGroupsFile() {
    return dataAccess.getJsonDbInUserData("/user-settings/groups");
}

function getDataFromFile(path) {
    let data = null;

    let cachedData = groupCache.get(path);

    if (cachedData) {
        data = cachedData;
    } else {
        try {
            data = getGroupsFile().getData(path);
            groupCache.set(path, data);
        } catch (err) {
            logger.error("error getting groups from file", err);
        }
    }
    return data;
}

exports.getAllGroups = function() {
    let groups = getDataFromFile("/");
    let groupArray = Object.keys(groups).map((k) => {
        return groups[k];
    });
    return groupArray.filter((g) => {
        return g.groupName !== 'banned';
    });
};

exports.getAllGroupNames = function() {
    return exports.getAllGroups().map((g) => {
        return g.groupName;
    });
};

exports.getGroup = function(groupName) {
    return exports.getAllGroups().filter((g) => {
        return g.groupName === groupName;
    })[0];
};

exports.getGroupsForUser = function(username) {
    return exports.getAllGroups().filter((g) => {
        return g != null && g.users != null && g.users.includes(username);
    });
};
