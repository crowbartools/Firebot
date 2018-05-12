'use strict';

const dataAccess = require('./data-access.js');
const logger = require('../logwrapper');

function getGroupsFile() {
    return dataAccess.getJsonDbInUserData("/user-settings/groups");
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
        return g.users.includes(username);
    });
};
