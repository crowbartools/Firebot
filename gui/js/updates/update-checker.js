// Requirements
const {ipcRenderer} = require('electron');
const request = require('request');
const versionFetch = require('version');

// Update Checker
// This will compare the app version number in package.json to the version number in json at firebottle.tv
// If they are different then it'll show a "new version available" link.
function updateChecker(){
    versionFetch.fetch(function(error,version){
        if(error){
            console.log(error);
        } else {
            request('http://firebottle.tv/Firebot/update-checker.json', function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    var jsonVersion = json.version;
                    var versionOverride = json.versionOverride;
                    
                    // Check if version matches.
                    if (version !== jsonVersion || versionOverride === true){
                        $('.updated-version').fadeIn('fast');
                    } else {
                        console.log('On newest version.')
                    }

                    $('title').text('Firebot Interactive || v'+version+' || @firebottletv');
                } else {
                    console.log(error);
                }
            })
        }
    })
}

// Run on app start
updateChecker();






    