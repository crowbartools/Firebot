"use strict";
const groupsAccess = require("./groups-access");
const logger = require("../logwrapper");

// This checks to see if the user is in a specific role.
function userIsInRole(userRoles, approvedRoles) {
  // If no permissions to check against, return true. They have permission.
  if (approvedRoles == null || approvedRoles.length === 0) {
    return true;
  }

  // Log which roles the user has and what we're checking for...
  logger.debug("Checking roles for permissions or spark exempt.");
  logger.debug("User Roles:" + userRoles + " | Looking for: " + approvedRoles);

  // If the user is the owner, they have permission.
  if (userRoles.includes("Owner")) {
    logger.debug("User is the owner!");
    return true;
  }

  // Okay, let's check to see if the user has a matching role.
  let roleMatch = false;
  userRoles.forEach(uRole => {
    if (approvedRoles.includes(uRole)) {
      logger.debug("Role match! " + uRole);
      roleMatch = true;
    }
  });

  if (roleMatch === true) {
    return true;
  }

  // If we get to here, the user does not have permission.
  logger.debug("User role check did not pass.");
  return false;
}

// This maps the apps role names to actual mixer chat role names.
function mapRoleNames(permissions) {
  if (permissions == null || permissions.length === 0) return [];
  return permissions.map(p => {
    switch (p) {
      case "Moderators":
        return "Mod";
      case "Subscribers":
        return "Subscriber";
      case "Channel Editors":
        return "ChannelEditor";
      case "Streamer":
        return "Owner";
      default:
        return p;
    }
  });
}

// Returns an array of all standard roles and viewer groups they're in.
function getCombinedRoles(username, userMixerRoles) {
  let userCustomRoles = groupsAccess.getGroupsForUser(username);
  for (role of userCustomRoles) {
    userMixerRoles.push(role.groupName);
  }
  return userMixerRoles;
}

async function userHasPermission(username, userMixerRoles, permission) {
  if (permission == null || permission.type == null) {
    return true;
  }

  let hasPermission = false;
  switch (permission.type) {
    case "group":
      hasPermission = userIsInRole(
        getCombinedRoles(username, userMixerRoles),
        mapRoleNames(permission.groups)
      );
      break;
    case "individual":
      hasPermission = username === permission.username;
      break;
    case "none":
    default:
      hasPermission = true;
  }

  return hasPermission;
}

exports.userHasPermission = userHasPermission;
exports.mapRoleNames = mapRoleNames;
