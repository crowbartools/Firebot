(function(){
  
 //This handles updates
 
 const _ = require('underscore')._;
 const JsonDb = require('node-json-db');
 const compareVersions = require('compare-versions');
 const https = require('https');
 const urlParser  = require('url');


 angular
  .module('firebotApp')
  .factory('updatesService', function ($q, $http, $sce, settingsService, utilityService) {
    // factory/service object
    var service = {}
    
    service.updateData = {};
    
    service.hasCheckedForUpdates = false;  
    
    service.updateIsAvailable = function() {
      return service.hasCheckedForUpdates ? service.updateData.updateIsAvailable : false;
    }
  

    // Update Checker
    // This checks for updates.
    service.checkForUpdate = function(){
        return $q((resolve, reject) => {
            // If user opts into betas we want to check different git api links.
            // If they are, we check releases as beta releases will be listed.
            // Else we check /latest which will only list the latest full release.
            
            // Start checking
            //autoUpdate.fire('check');

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
              
              console.log(gitNewest);          

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
              
              service.downloadUpdate();
              resolve(updateObject)
            }, (error) => {
              console.log(error);
              reject(false);
            });
        });
    }
    
    
    service.downloadUpdate = function () {
      console.log("Attempting to get zip file...")
      downloadFile(service.updateData.gitZipDownloadUrl);  
    }
    
    service.updateIsDownloaded = function () {
      
    }
    
    service.extractUpdate = function () {
      var admzip = require('adm-zip');
    
      var fileName = `firebotUpdate-${service.updateData.gitVersion}.zip`
    
      var zip = new admzip(fileName);
      var zipEntries = zip.getEntries(); // an array of ZipEntry records
      var deferred = Defer();
      
      
      if (subfolder) {
        zip.extractAllTo('./updateTest', true);
      } else {
        zip.extractEntryTo(zipEntries[0], './updateTest', false, true);
      }
    
      fs.unlink(name, deferred.resolve.bind(deferred));
    }
    
    
    var redirectCount = 0;
    function downloadFile(zipUrl) {
      var fileName = `firebotUpdate-${service.updateData.gitVersion}.zip`
          
      var parsedUrlOptions = urlParser.parse(zipUrl);
      
      parsedUrlOptions.headers = {
        'Accept': "application/octet-stream"
      }
    
      var request = https.get(parsedUrlOptions, function(res) {
        // we need to redirect
        console.log(res);
        if(res.statusCode === 302) {
          console.log("Redirecting...");
          if(redirectCount < 1) {
            redirectCount++;
            downloadFile(res.headers.location);
          }
          return;
        }
        
        // Check if the file already exists and remove it if it does
        if (fs.existsSync('_' + fileName)) fs.unlinkSync('_' + fileName);
    
        // Download started
        //emit(self, 'download.start', name);
        console.log("Download started!");
    
        // Writestream for the binary file
        var file = fs.createWriteStream('_' + fileName),
          len = parseInt(res.headers['content-length'], 10),
          current = 0;
    
        // Pipe any new block to the stream
        res.pipe(file);
    
        var dataRecieve = function(chunk) {
          current += chunk.length;
          perc = (100.0 * (current / len)).toFixed(2);
          //emit(self, 'download.progress', name, perc);
          console.log(`Downloaded: ${perc}%`);
        };
      
    
        res.on('data', _.debounce(dataRecieve, 0));

    
        res.on('end', function() {
          file.end();
        });
    
        file.on('finish', function() {
          fs.renameSync('_' + fileName, fileName);
          //emit(self, 'download.end', name);
          redirectCount = 0;
          console.log("Download finished!!");
          service.extractUpdate();
    
          //deferred.resolve();
        });
      });
      request.end();
      request.on('error', function(e) {
        //deferred.reject();
        //emit(self, 'download.error', e);
        console.log("Error", e);
      });
    }
    
    /* Extract logic.
    var extract = function(name, subfolder) {
      var admzip = require('adm-zip');
    
      var zip = new admzip(name);
      var zipEntries = zip.getEntries(); // an array of ZipEntry records
      var deferred = Defer();
    
      if (subfolder) {
        zip.extractAllTo('./', true);
      } else {
        zip.extractEntryTo(zipEntries[0], './', false, true);
      }
    
      fs.unlink(name, deferred.resolve.bind(deferred));
      return deferred;
    };
    */

    return service;
  });
})();
