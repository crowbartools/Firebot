(function(){
  
 //This handles updates
 
 const _ = require('underscore')._;
 const VersionCompare = require('../../lib/compare-versions.js');
 const UpdateType = VersionCompare.UpdateType;

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
            
            var firebotReleasesUrl = "https://api.github.com/repos/Firebottle/Firebot/releases/latest";
            
            if(settingsService.notifyOnBeta() || settingsService.getAutoUpdateLevel() >= 4){
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
              var gitDate = gitNewest.published_at;
              var gitLink = gitNewest.html_url;
              var gitNotes = marked(gitNewest.body);
              var gitZipDownloadUrl = gitNewest.assets[0].browser_download_url;

              // Now lets look to see if there is a newer version.
              var updateType = VersionCompare.compareVersions(gitNewest.tag_name, currentVersion);

              var updateIsAvailable = false;
              if(updateType != UpdateType.NONE) {
                  var autoUpdateLevel = settingsService.getAutoUpdateLevel();
                  // Check if we should auto update based on the users setting
                  if(shouldAutoUpdate(autoUpdateLevel, updateType)) {
                     utilityService.showDownloadModal();
                     listenerService.fireEvent(listenerService.EventType.DOWNLOAD_UPDATE);
                  } else {
                     // Dont autoupdate, just notify the user
                     updateIsAvailable = true;
                  }
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
        utilityService.showDownloadModal();
        listenerService.fireEvent(listenerService.EventType.DOWNLOAD_UPDATE);
      }         
    }
    
    function shouldAutoUpdate(autoUpdateLevel, updateType) {
      // if auto updating is completely disabled
      if(autoUpdateLevel == 0) { return false; }
      
      // check each update type
      switch(updateType) {
        case UpdateType.NONE:
          return false;
        case UpdateType.PRELEASE:
          return autoUpdateLevel >= 4;
        case UpdateType.OFFICAL:
        case UpdateType.PATCH:
          return autoUpdateLevel >= 1;
        case UpdateType.MINOR:
          return autoUpdateLevel >= 2;
        case UpdateType.MAJOR:
          return autoUpdateLevel >= 3;
        default:
          return false;
      }
    }

    return service;
  });
})();
