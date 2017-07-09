(function(){
  
 //This handles groups
 
 const _ = require('underscore')._;
 const dataAccess = require('../../lib/data-access.js');

 angular
  .module('firebotApp')
  .factory('groupsService', function (boardService) {
    var service = {};
    
    var groups = [];
        
    service.loadViewerGroups = function() {
      // Load up all custom made groups in each dropdown.
      var dbGroup = dataAccess.getJsonDbInUserData("/user-settings/groups");      
      try{
          var rawGroups = dbGroup.getData('/');
          if(rawGroups != null) {
            groups = _.values(rawGroups);
          }
          ensureBannedGroupExists();          
      }catch(err){console.log(err)};
    }
    
    service.getViewerGroups = function(filterOutBannedGroup) {
      var groupList = [];
      if(groups != null) {
        // Filter out the banned group. This will happen by default, even if the 
        // argument isn't passed.
        if(filterOutBannedGroup != false) {
          groupList = _.reject(groups, (group) => { return group.groupName == "banned"});
        } else {
          groupList = groups;
        }
      }
      return groupList;
    }

    service.getActiveGroups = function(){
      // Get the selected board and set default groupList var.
      var dbGroup = boardService.getSelectedBoard();
      var groupList = [];

      // Go through each scene on the current board and push default groups to groupList.
      for (scene in dbGroup.scenes){
        var scene = dbGroup.scenes[scene];
        var sceneGroups = scene.default;
        for(item of sceneGroups){
          groupList.push(item);
        }
      }

      // Filter out duplicates
      groupList = groupList.filter(function(elem, pos) {
          return groupList.indexOf(elem) == pos;
      })

      return groupList;
    }
    
    service.addOrUpdateViewerGroup = function(group, previousName) {
      if(group.groupName == "banned") return;
      var dbGroup = dataAccess.getJsonDbInUserData("/user-settings/groups");
      
      if(previousName != null && previousName !== "" && previousName !== group.groupName) {
        deleteViewerGroup(previousName);
      }
        
      dbGroup.push("/" + group.groupName, group);
        
      service.loadViewerGroups();
    }
    
    service.removeViewerGroup = function(groupName) {
      
      deleteViewerGroup(groupName);
      
      service.loadViewerGroups();
    }
    
    function deleteViewerGroup(groupName) {
      var dbGroup = dataAccess.getJsonDbInUserData("/user-settings/groups");
      dbGroup.delete("/" + groupName);
      
      boardService.deleteViewerGroupFromAllBoards(groupName);
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
      var group = _.findWhere(groups, {groupName: "banned"});
      return group;
    }
    
    function saveBannedGroup() {
      var dbGroup = dataAccess.getJsonDbInUserData("/user-settings/groups");
      var bannedGroup = service.getBannedGroup();
      dbGroup.push("/" + bannedGroup.groupName, bannedGroup);
    }
    
    function ensureBannedGroupExists() {
      var bannedGroupExists = _.any(groups, (group) => {
        return group.groupName == 'banned';
      });
      
      if(!bannedGroupExists) {
        var bannedGroup = {
          groupName: 'banned',
          users: []
        }
        var dbGroup = dataAccess.getJsonDbInUserData("/user-settings/groups");
        dbGroup.push("/" + bannedGroup.groupName, bannedGroup);  
        groups.push(bannedGroup);
      }
    }
  
    return service;
  });
})();