(function(){
  
 //This handles updates
 
 const _ = require('underscore')._;
 const JsonDb = require('node-json-db');
 const compareVersions = require('compare-versions');

 angular
  .module('firebotApp')
  .factory('updatesService', function ($q, $http, $sce, settingsService, utilityService, listenerService) {
    // factory/service object
    var service = {}
    
    service.updateData = {};
    
    service.isCheckingForUpdates = false;
    
    service.hasCheckedForUpdates = false;
    
    service.updateIsAvailable = function() {
      return service.hasCheckedForUpdates ? service.updateData.updateIsAvailable : false;
    }

    // Update Checker
    // This checks for updates.
    service.checkForUpdate = function(){
      service.isCheckingForUpdates = true;
        return $q((resolve, reject) => {
            // If user opts into betas we want to check different git api links.
            // If they are, we check releases as beta releases will be listed.
            // Else we check /latest which will only list the latest full release.      

            var firebotReleasesUrl = "https://api.github.com/repos/Firebottle/Firebot/releases/latest";
            
            if(settingsService.isBetaTester() === "Yes"){
                firebotReleasesUrl = "https://api.github.com/repos/Firebottle/Firebot/releases";
            }          
            
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
              var gitZipDownloadUrl = gitNewest.assets[0].browser_download_url;

              // Now lets look to see if there is a newer version.
              var versionCompare = compareVersions(gitNewest.tag_name, currentVersion);

              var updateIsAvailable = false;
              if(versionCompare > 0){
                  updateIsAvailable = true;
              }

              // Build update object.
              var updateObject = {
                  gitName: gitName,
                  gitVersion: gitNewest.tag_name,
                  gitDate: gitDate,
                  gitLink: gitLink,
                  gitNotes: $sce.trustAsHtml(gitNotes),
                  gitZipDownloadUrl: gitZipDownloadUrl,
                  updateIsAvailable: updateIsAvailable
              }
              
              service.updateData = updateObject;
              
              service.hasCheckedForUpdates = true;
              service.isCheckingForUpdates = false;
              
              resolve(updateObject)
            }, (error) => {
              service.isCheckingForUpdates = false;
              console.log(error);
              reject(false);
            });
        });
    }

    service.downloadAndInstallUpdate = function() {
      if(service.updateIsAvailable()) {
        listenerService.fireEvent(listenerService.EventType.DOWNLOAD_UPDATE);
      }         
    }
    
    return service;
  });
})();
