(function(){
  
 //This handles groups
 
 const _ = require('underscore')._;
 const JsonDb = require('node-json-db');

 angular
  .module('firebotApp')
  .factory('groupsService', function () {
    var service = {};
    
    var _groups = [];
        
    service.loadViewerGroups = function() {
      // Load up all custom made groups in each dropdown.
      var dbGroup = new JsonDB("./user-settings/groups", true, true);      
      try{
          var rawGroups = dbGroup.getData('/');
          if(rawGroups != null) {
            _groups = _.values(rawGroups);
          }
          ensureBannedGroupExists();          
      }catch(err){console.log(err)};
    }
    
    service.getViewerGroups = function(filterOutBannedGroup) {
      var groupList = [];
      if(_groups != null) {
        // Filter out the banned group. This will happen by default, even if the 
        // argument isn't passed.
        if(filterOutBannedGroup != false) {
          groupList = _.reject(_groups, (group) => { return group.groupName == "banned"});
        } else {
          groupList = _groups;
        }
      }
      return groupList;
    }
    
    service.addOrUpdateViewerGroup = function(group) {
      if(group.groupName == "banned") return;
      var dbGroup = new JsonDB("./user-settings/groups", true, true);
      dbGroup.push("/" + group.groupName, group);  
      service.loadViewerGroups();
    }
    
    service.removeViewerGroup = function(groupName) {
      var dbGroup = new JsonDB("./user-settings/groups", true, true);
      dbGroup.delete("/" + groupName);
      service.loadViewerGroups();
    }
    
    /**
    * Banned Usergroup Methods 
    */
    
    service.addUserToBannedGroup = function(username) {
      if(username != null && username != "") {
        service.getBannedGroup().users.push(username);
      }            
      saveBannedGroup();
    }
    
    service.removeUserFromBannedGroupAtIndex = function(index) {
      service.getBannedGroup().users.splice(index,1);
      saveBannedGroup();
    }
    
    service.getBannedGroup = function() {
      ensureBannedGroupExists();
      var group = _.findWhere(_groups, {groupName: "banned"});
      return group;
    }
    
    function saveBannedGroup() {
      var dbGroup = new JsonDB("./user-settings/groups", true, true);
      var bannedGroup = service.getBannedGroup();
      dbGroup.push("/" + bannedGroup.groupName, bannedGroup);
    }
    
    function ensureBannedGroupExists() {
      var bannedGroupExists = _.any(_groups, (group) => {
        return group.groupName == 'banned';
      });
      
      if(!bannedGroupExists) {
        var bannedGroup = {
          groupName: 'banned',
          users: []
        }
        var dbGroup = new JsonDB("./user-settings/groups", true, true);
        dbGroup.push("/" + bannedGroup.groupName, bannedGroup);  
        _groups.push(bannedGroup);
      }
    }
  
    return service;
  });
})();