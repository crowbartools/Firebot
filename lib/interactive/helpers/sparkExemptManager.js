const {ipcMain} = require('electron');
var settings = require("../settings-access.js").settings;

var exemptUsers = [];
var exemptGroups = [];
var foreverExempt = ['Firebottle', 'ebiggz', 'ThePerry'];

function userIsExempt(userName) {
  return exemptUsers.includes(userName) || foreverExempt.includes(userName);
}

function loadExemptList() {
 exemptUsers = settings.getSparkExemptUsers().users;
 exemptGroups = settings.getSparkExemptUsers().groups;
}

ipcMain.on('sparkExemptUpdated', function(event) {
  loadExemptList();
});

loadExemptList();

exports.userIsExempt = userIsExempt;



