const groupsAccess = require('../../lib/groups-access');

exports.getAllGroups = function(req, res) {
  var response;
  if(req.query.username) {
    response = groupsAccess.getGroupsForUser(req.query.username);
  } else {
    response = groupsAccess.getAllGroups();
  }
  if(req.query.onlynames == "true") {
    response = response.map((g) => { return g.groupName; });
  }
  res.json(response);
}

exports.getGroupNames = function(req, res) {
  if(req.query.username) {
    res.json(groupsAccess.getGroupsForUser(req.query.username));
  } else {
    res.json(groupsAccess.getAllGroupNames());
  }
}

exports.getGroup = function(req, res) {

  res.json(groupsAccess.getGroup(req.params.groupName));
}

exports.getGroupUsers = function(req, res) {
  res.json(groupsAccess.getGroup(req.params.groupName).users);
}
