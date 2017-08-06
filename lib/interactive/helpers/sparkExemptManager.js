const {ipcMain} = require('electron');
var settings = require("../settings-access.js").settings;

var exemptUsers = [];
var foreverExempt = ['Firebottle'];

function userIsExempt(userName) {
  return exemptUsers.includes(userName) || foreverExempt.includes(userName);
}

function loadExemptList() {
 exemptUsers = settings.getSparkExemptUsers().users;
}

ipcMain.on('sparkExemptUpdated', function(event) {
  loadExemptList();
});

loadExemptList();

exports.userIsExempt = userIsExempt;



