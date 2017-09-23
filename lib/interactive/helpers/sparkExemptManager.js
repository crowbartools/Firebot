const {ipcMain} = require('electron');
var settings = require("../settings-access.js").settings;
const groupsAccess = require('../../groups-access');

var exemptUsers = [];
var exemptGroups = [];
var devExempt = ['Firebottle', 'ebiggz', 'ThePerry'];

function userIsExempt(userName, mixerGroup) {
  var customGroups = groupsAccess.getGroupsForUser(userName).map((g) => { return g.groupName; });
  
  var isExempt = (exemptUsers.includes(userName) ||
    devExempt.includes(userName) ||
    exemptGroups.includes(mixerGroup) ||
    exemptGroups.some(g => customGroups.includes(g)));
    
  return isExempt;
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



