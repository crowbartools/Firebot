// Requirements
const request = require('request');
const JsonDB = require('node-json-db');
const appVersion = require('electron').remote.app.getVersion();
const compareVersions = require('compare-versions');
const marked = require('marked');

// Update Checker
// This will compare the app version number in package.json to the version number in json at firebottle.tv
// If they are different then it'll show a "new version available" link.
function updateChecker(){
    var dbSettings = new JsonDB("./user-settings/settings", true, false);
    try{
        var betaOptIn = dbSettings.getData('/betaOptIn');
    } catch (err){
        var betaOptIn = "no";
    }
    

    if(betaOptIn === "yes"){
        // We need a setting on the settings page to opt into beta. 
        // If they are, then hit the releases api and see if the latest name matches current app version.
        var gitApi = "https://api.github.com/repos/Firebottle/Firebot/releases";
    } else {
        // Otherwise they don't want beta updates.
        // So hit the release/latest api and see if the newest one matches.
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
                // Get app version and change titlebar.
                var version = appVersion;
                $('title').text('Firebot Interactive || v'+version+' || @firebottletv');

                // Parse github api to get tag name.
                var git = JSON.parse(body);
                if(git.length > 0){
                    var gitNewest = git[0];
                } else {
                    var gitNewest = git;
                }
                var gitName = gitNewest.name;
                var gitDate = parseISOLocal(gitNewest.created_at);
                var gitLink = gitNewest.html_url;
                var gitNotes = marked(gitNewest.body);

                // Output all to updates page.
                $('.updates .latest-update').text(gitName);
                $('.updates .release-date').text(gitDate);
                $('.updates .update-notes').html(gitNotes);
                $('.updates .update-buttons .github-link').attr('href',gitLink);

                // Now lets look to see if we should display the alert.
                var gitVersion = gitNewest.tag_name;
                var versionCompare = compareVersions(gitVersion, version);

                // If there is a newer version, show the alert.
                if (versionCompare > 0){
                    $('.updated-version a').append(' ('+gitVersion+')');
                    $('.updated-version').fadeIn('fast');
                }
            } else {
                console.log(error, response, body);
            }
        })
    } catch (err){
        console.log(err);
    }
}

// ISO Date Parser
// Takes an ISO date and changes it to local time date that is readable.
function parseISOLocal(s) {
  var b = s.split(/\D/);
  return new Date(b[0], b[1]-1, b[2], b[3], b[4], b[5]);
}

// Run on app start
updateChecker();
