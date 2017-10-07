const {ipcMain} = require('electron');
var settings = require("../../common/settings-access.js").settings;
const groupsAccess = require('../../common/groups-access');
const logger = require('../../errorLogging.js');

var exemptUsers = [];
var exemptGroups = [];
var devExempt = ['Firebottle', 'ebiggz', 'ThePerry'];

function userIsExempt(userName, mixerGroup) {

  if(userName != null && userName.trim().length < 1) {
    // User name is empty. This shouldnt happen, but just to be safe.
    return false;
  }

  if(exemptGroups.length == 0 && exemptUsers.length == 0) {
    // Exempt groups and users arent being used. Dont even bother checking anything else.
    return false;
  }

  // get the custom groups for a user
  var userGroups = groupsAccess.getGroupsForUser(userName).map((g) => { return g.groupName; });

  if(mixerGroup != null && mixerGroup.trim().length < 1) {
    // add the mixer group to the list, if it exists
    userGroups.push(mixerGroup);
  }

  if(exemptGroups.length > 0 && userGroups.length > 0) {
    // we have exempt groups
    if(exemptGroups.some(g => userGroups.includes(g))) {
      // user is in one or more of the exempt groups!
      logger.log(`${userName} is in an exempt group. Not charging sparks. Exempt groups: ${exemptGroups.join()}, user groups: ${userGroups.join()}`);
      return true;
    }
  }

  if(exemptUsers.length > 0) {
    // we have exempt users
    if(exemptUsers.includes(userName)) {
      // user is in the exempt user list!
      logger.log(`${userName} is on exempt list. Not charging sparks. Exempt users: ${exemptUsers.join()}`);
      return true;
    }
  }

  if(devExempt.includes(userName)) {
    logger.log(`${userName} is dev exempt. Not charging sparks.`);
    // user is a dev.
    return true;
  }

    
  return false;
}

function loadExemptList() {
  var sparkExemptions = settings.getSparkExemptUsers();
  exemptUsers = sparkExemptions.users;
  exemptGroups = sparkExemptions.groups;
}

ipcMain.on('sparkExemptUpdated', function(event) {
  loadExemptList();
});

loadExemptList();

exports.userIsExempt = userIsExempt;



