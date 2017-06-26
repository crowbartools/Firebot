(function(){
  
 //This handles updates
 
 const _ = require('underscore')._;
 const JsonDb = require('node-json-db');
 const request = require('request');
 const compareVersions = require('compare-versions');

 angular
  .module('firebotApp')
  .factory('updatesService', function (settingsService) {
    // factory/service object
    var service = {}

    // Update Checker
    // This checks for updates.
    service.updateCheck = function(){
        return new Promise((resolve, reject) => {
            // If user opts into betas we want to check different git api links.
            // If they are, we check releases as beta releases will be listed.
            // Else we check /latest which will only list the latest full release.
            var betaOptIn = settingsService.isBetaTester();
            if(betaOptIn === "Yes"){
                var gitApi = "https://api.github.com/repos/Firebottle/Firebot/releases";
            } else {
                var gitApi = "https://api.github.com/repos/Firebottle/Firebot/releases/latest";
            }
            
            try{
                var options = {
                    url: gitApi,
                    headers: {
                        'User-Agent': 'request'
                    }
                };
                request(options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {

                        // Get app version
                        var version = require('electron').remote.app.getVersion();

                        // Parse github api to get tag name.
                        var git = JSON.parse(body);
                        if(git.length > 0){
                            var gitNewest = git[0];
                        } else {
                            var gitNewest = git;
                        }

                        var gitName = gitNewest.name;
                        var gitDate = gitNewest.created_at;
                        var gitLink = gitNewest.html_url;
                        var gitNotes = marked(gitNewest.body);

                        // Now lets look to see if there is a newer version.
                        var versionCompare = compareVersions(gitNewest.tag_name, version);
                        console.log(versionCompare)
                        if(versionCompare > 0){
                            versionCompare = true;
                        } else {
                            versionCompare = false;
                        }

                        // Build update object.
                        var updateObject = {
                            gitName: gitName,
                            gitDate: gitDate,
                            gitLink: gitLink,
                            gitNotes: gitNotes,
                            gitVersionCompare: versionCompare
                        }
                        
                        resolve(updateObject)

                    } else {
                        console.log(error, response, body);
                        reject(false);
                    }
                })
            } catch (err){
                console.log(err);
                reject(false);
            }
        });
    }
    return service;
  });
})();
