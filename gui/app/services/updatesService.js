(function(){
  
 //This handles updates
 
 const _ = require('underscore')._;
 const JsonDb = require('node-json-db');
 const compareVersions = require('compare-versions');

 angular
  .module('firebotApp')
  .factory('updatesService', function ($q, $http, $sce, settingsService) {
    // factory/service object
    var service = {}
    
    service.updateData = {};
    
    service.hasCheckedForUpdates = false;  
    
    service.updateIsAvailable = function() {
      if(service.hasCheckedForUpdates) {
        return service.updateData.updateIsAvailable;
      } else {
        return false;
      }
    }

    // Update Checker
    // This checks for updates.
    service.checkForUpdate = function(){
        return $q((resolve, reject) => {
            // If user opts into betas we want to check different git api links.
            // If they are, we check releases as beta releases will be listed.
            // Else we check /latest which will only list the latest full release.

            var firebotReleasesUrl = "https://api.github.com/repos/Firebottle/Firebot/releases/latest";
            
            if(settingsService.isBetaTester() === "Yes"){
                firebotReleasesUrl = "https://api.github.com/repos/Firebottle/Firebot/releases";
            }
            
            var options = {
                headers: {
                    'User-Agent': 'request'
                }
            };
            
            $http.get(firebotReleasesUrl).then((response) => {
              // Get app version
              var currentVersion = require('electron').remote.app.getVersion();
              
              // Parse github api to get tag name.
              var gitNewest = {}
              if(response.data.length > 0){
                  gitNewest = response.data[0];
              } else {
                  gitNewest = response.data;
              }            

              var gitName = gitNewest.name;
              var gitDate = gitNewest.created_at;
              var gitLink = gitNewest.html_url;
              var gitNotes = marked(gitNewest.body);

              // Now lets look to see if there is a newer version.
              var versionCompare = compareVersions(gitNewest.tag_name, currentVersion);

              var updateIsAvailable = false;
              if(versionCompare > 0){
                  updateIsAvailable = true;
              }

              // Build update object.
              var updateObject = {
                  gitName: gitName,
                  gitDate: gitDate,
                  gitLink: gitLink,
                  gitNotes: $sce.trustAsHtml(gitNotes),
                  updateIsAvailable: updateIsAvailable
              }
              
              service.updateData = updateObject;
              
              service.hasCheckedForUpdates = true;
              
              resolve(updateObject)
            }, (error) => {
              console.log(error);
              reject(false);
            });
        });
    }
    return service;
  });
})();
