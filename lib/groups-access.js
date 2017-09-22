const dataAccess = require('./data-access.js');

function getGroupsFile() {
  return dataAccess.getJsonDbInUserData("/user-settings/groups");
}

function getDataFromFile(path) {
  var data = null;
  try{
    data = getGroupsFile().getData(path);      
  } catch(err){};
  return data;
}

exports.getAllGroups = function() {
  var groups = getDataFromFile("/");
  var groupArray = Object.keys(groups).map((k) => { return groups[k]; });
  return groupArray.filter((g) => { return g.groupName !== 'banned'; });
}

exports.getAllGroupNames = function() {
  return exports.getAllGroups().map((g) => { return g.groupName; });
}

exports.getGroup = function(groupName) {
  return exports.getAllGroups().filter((g) => { return g.groupName === groupName; })[0];
}

exports.getGroupsForUser = function(username) {
  return exports.getAllGroups().filter((g) => { return g.users.includes(username); });  
}
